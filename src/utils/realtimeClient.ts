import { Peer, DataConnection } from 'peerjs';
import { io, Socket } from 'socket.io-client';
import {
  RoomData,
  Player,
  DrawingStroke,
  ChatMessage,
  RoundResultData,
  MiniGameType,
} from '../types/game';
import {
  generateRoomCode,
  getRandomAvatar,
  startRoundLogic,
  endRoundLogic,
  handleAnswerLogic,
  getRoundDuration,
} from './gameEngine';
import { getBackendUrl } from './config';

export type GameEventCallback<T = any> = (data: T) => void;

interface PeerMessage {
  type: string;
  payload?: any;
}

const PEER_CONFIG = {
  host: '0.peerjs.com',
  port: 443,
  path: '/',
  secure: true,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.services.mozilla.com' },
      { urls: 'stun:global.stun.twilio.com:3478' },
    ],
  },
};

export class RealtimeClient {
  private socket: Socket | null = null;
  private peer: Peer | null = null;
  private hostConnections: Map<string, DataConnection> = new Map();
  private clientConnection: DataConnection | null = null;

  private isHost: boolean = false;
  private currentRoom: RoomData | null = null;
  private currentPlayerId: string | null = null;
  private timerInterval: any = null;
  private introTimeout: any = null;

  // Event Listeners
  private listeners: Record<string, Set<GameEventCallback>> = {
    'room:update': new Set(),
    'game:timer': new Set(),
    'game:round_started': new Set(),
    'game:round_ended': new Set(),
    'game:answer_result': new Set(),
    'draw:stroke_received': new Set(),
  };

  constructor() {
    this.initSocketIfAvailable();
  }

  private initSocketIfAvailable() {
    // Attempt local Socket.IO connection only if in development or custom server
    try {
      const backendUrl = getBackendUrl();
      // Only connect socket if not explicitly on static vercel host or if socket works
      this.socket = io(backendUrl || undefined, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        timeout: 4000,
        autoConnect: true,
      });

      this.socket.on('room:update', (room: RoomData) => {
        if (!this.isHost) {
          this.currentRoom = room;
          this.emitLocal('room:update', room);
        }
      });

      this.socket.on('game:timer', (data) => {
        if (!this.isHost) this.emitLocal('game:timer', data);
      });

      this.socket.on('game:round_started', () => {
        if (!this.isHost) this.emitLocal('game:round_started', {});
      });

      this.socket.on('game:round_ended', (data) => {
        if (!this.isHost) this.emitLocal('game:round_ended', data);
      });

      this.socket.on('game:answer_result', (data) => {
        this.emitLocal('game:answer_result', data);
      });

      this.socket.on('draw:stroke_received', (stroke) => {
        this.emitLocal('draw:stroke_received', stroke);
      });
    } catch (e) {
      console.warn('[RealtimeClient] Socket.IO initialization notice:', e);
    }
  }

  public on(event: string, cb: GameEventCallback) {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }
    this.listeners[event].add(cb);
  }

  public off(event: string, cb: GameEventCallback) {
    if (this.listeners[event]) {
      this.listeners[event].delete(cb);
    }
  }

  private emitLocal(event: string, data?: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[RealtimeClient] Error in listener for ${event}:`, err);
        }
      });
    }
  }

  private broadcastToPeers(type: string, payload?: any) {
    const msg: PeerMessage = { type, payload };
    this.hostConnections.forEach((conn) => {
      if (conn && conn.open) {
        try {
          conn.send(msg);
        } catch (e) {
          console.warn('[RealtimeClient] Peer send error:', e);
        }
      }
    });
  }

  private sendToHost(type: string, payload?: any) {
    if (this.clientConnection && this.clientConnection.open) {
      this.clientConnection.send({ type, payload });
    }
  }

  // ==========================================
  // HOST GAME ENGINE METHODS (RUN ON HOST CLIENT)
  // ==========================================

  private broadcastRoomUpdate() {
    if (!this.currentRoom) return;
    this.emitLocal('room:update', { ...this.currentRoom });
    this.broadcastToPeers('room:update', { ...this.currentRoom });

    // Also push to socket.io if host is connected to server
    if (this.socket && this.socket.connected) {
      this.socket.emit('room:host_sync', this.currentRoom);
    }
  }

  private clearHostTimers() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.introTimeout) {
      clearTimeout(this.introTimeout);
      this.introTimeout = null;
    }
  }

  private startRound() {
    if (!this.currentRoom) return;
    this.clearHostTimers();

    const nextGame = startRoundLogic(this.currentRoom);
    if (!nextGame) {
      this.broadcastRoomUpdate();
      return;
    }

    this.broadcastRoomUpdate();

    // After 3.5 seconds of intro, start playing
    this.introTimeout = setTimeout(() => {
      if (!this.currentRoom || this.currentRoom.state !== 'round_intro') return;

      const startingTeam: 1 | 2 = this.currentRoom.currentRound % 2 === 1 ? 1 : 2;
      this.currentRoom.state = 'playing';
      this.currentRoom.activeTeam = startingTeam;
      this.currentRoom.teamTurnPhase = 1;
      this.currentRoom.teamTimeLeft = 30;
      this.currentRoom.roundDuration = 60;
      this.currentRoom.roundStartTime = Date.now();
      this.currentRoom.roundEndTime = this.currentRoom.roundStartTime + 60 * 1000;

      this.broadcastRoomUpdate();
      this.emitLocal('game:round_started', {});
      this.broadcastToPeers('game:round_started', {});

      let teamTime = 30;
      let phase: 1 | 2 = 1;

      this.emitLocal('game:timer', {
        timeLeft: teamTime,
        activeTeam: this.currentRoom.activeTeam,
        phase,
      });
      this.broadcastToPeers('game:timer', {
        timeLeft: teamTime,
        activeTeam: this.currentRoom.activeTeam,
        phase,
      });

      this.timerInterval = setInterval(() => {
        if (!this.currentRoom || this.currentRoom.state !== 'playing') {
          this.clearHostTimers();
          return;
        }

        teamTime -= 1;
        this.currentRoom.teamTimeLeft = Math.max(0, teamTime);

        // Progressive reveal for WhoAmI
        if (nextGame === 'who_am_i' && this.currentRoom.roundData) {
          if (teamTime === 20 && this.currentRoom.roundData.unlockedCluesCount < 2) {
            this.currentRoom.roundData.unlockedCluesCount = 2;
            this.currentRoom.roundData.currentPoints = 75;
            this.broadcastRoomUpdate();
          } else if (teamTime === 10 && this.currentRoom.roundData.unlockedCluesCount < 3) {
            this.currentRoom.roundData.unlockedCluesCount = 3;
            this.currentRoom.roundData.currentPoints = 50;
            this.broadcastRoomUpdate();
          }
        }

        this.emitLocal('game:timer', {
          timeLeft: Math.max(0, teamTime),
          activeTeam: this.currentRoom.activeTeam,
          phase,
        });
        this.broadcastToPeers('game:timer', {
          timeLeft: Math.max(0, teamTime),
          activeTeam: this.currentRoom.activeTeam,
          phase,
        });

        // When team time reaches 0
        if (teamTime <= 0) {
          if (phase === 1) {
            // Automatically switch turn to the second team for 30s
            phase = 2;
            teamTime = 30;
            const secondTeam: 1 | 2 = startingTeam === 1 ? 2 : 1;
            this.currentRoom.activeTeam = secondTeam;
            this.currentRoom.teamTurnPhase = 2;
            this.currentRoom.teamTimeLeft = 30;
            this.broadcastRoomUpdate();
          } else {
            // Both teams finished their 30s turn -> End Round
            this.clearHostTimers();
            this.endRound(null);
          }
        }
      }, 1000);
    }, 3500);
  }

  private endRound(winnerPlayerId: string | null) {
    if (!this.currentRoom) return;
    this.clearHostTimers();

    const results = endRoundLogic(this.currentRoom, winnerPlayerId);
    this.broadcastRoomUpdate();
    this.emitLocal('game:round_ended', results);
    this.broadcastToPeers('game:round_ended', results);
  }

  // Handle messages sent by other players to the Host
  private handleHostReceivedMessage(fromPlayerId: string, conn: DataConnection, msg: PeerMessage) {
    if (!this.currentRoom || !this.isHost) return;

    switch (msg.type) {
      case 'room:join': {
        const { nickname, avatar, existingPlayerId } = msg.payload || {};
        const pId = existingPlayerId || `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        
        // Save connection
        this.hostConnections.set(pId, conn);

        // Check if player already exists
        if (this.currentRoom.players[pId]) {
          this.currentRoom.players[pId].isConnected = true;
          this.currentRoom.players[pId].socketId = conn.peer;
        } else {
          const playersList = Object.values(this.currentRoom.players);
          const t1 = playersList.filter((p) => p.team === 1).length;
          const t2 = playersList.filter((p) => p.team === 2).length;
          const team: 1 | 2 = t1 <= t2 ? 1 : 2;

          const newPlayer: Player = {
            id: pId,
            socketId: conn.peer,
            nickname: (nickname || `لاعب ${playersList.length + 1}`).trim().slice(0, 15),
            avatar: avatar || getRandomAvatar(),
            score: 0,
            roundScore: 0,
            isHost: false,
            isConnected: true,
            isReady: false,
            team,
            correctGuessesCount: 0,
            riddleWins: 0,
            drawingsWon: 0,
            penalties: 0,
          };

          this.currentRoom.players[pId] = newPlayer;
        }

        // Send confirmation back to joined player
        conn.send({
          type: 'room:join_ack',
          payload: {
            success: true,
            playerId: pId,
            room: this.currentRoom,
          },
        });

        this.broadcastRoomUpdate();
        break;
      }

      case 'player:ready': {
        if (this.currentRoom.players[fromPlayerId]) {
          this.currentRoom.players[fromPlayerId].isReady = !this.currentRoom.players[fromPlayerId].isReady;
          this.broadcastRoomUpdate();
        }
        break;
      }

      case 'player:team': {
        const { team } = msg.payload || {};
        if (this.currentRoom.players[fromPlayerId] && this.currentRoom.state === 'lobby') {
          this.currentRoom.players[fromPlayerId].team = team === 1 ? 1 : 2;
          this.broadcastRoomUpdate();
        }
        break;
      }

      case 'game:start': {
        if (fromPlayerId === this.currentRoom.hostId && this.currentRoom.state === 'lobby') {
          this.currentRoom.currentRound = 0;
          this.currentRoom.gameHistory = [];
          Object.values(this.currentRoom.players).forEach((p) => {
            p.score = 0;
            p.roundScore = 0;
          });
          this.startRound();
        }
        break;
      }

      case 'game:next_round': {
        if (this.currentRoom.state === 'round_result') {
          this.startRound();
        }
        break;
      }

      case 'game:play_again': {
        if (this.currentRoom.state === 'final_results') {
          this.currentRoom.state = 'lobby';
          this.currentRoom.currentRound = 0;
          this.currentRoom.gameHistory = [];
          Object.values(this.currentRoom.players).forEach((p) => {
            p.score = 0;
            p.roundScore = 0;
            p.isReady = false;
          });
          this.broadcastRoomUpdate();
        }
        break;
      }

      case 'game:answer': {
        const { answer } = msg.payload || {};
        if (this.currentRoom.state !== 'playing' || !answer) return;

        const { isCorrect, roundEnded } = handleAnswerLogic(this.currentRoom, fromPlayerId, answer);

        // Notify responder
        conn.send({
          type: 'game:answer_result',
          payload: { correct: isCorrect, playerId: fromPlayerId },
        });

        if (roundEnded) {
          this.clearHostTimers();
          this.broadcastRoomUpdate();
          this.emitLocal('game:round_ended', this.currentRoom.lastRoundResults);
          this.broadcastToPeers('game:round_ended', this.currentRoom.lastRoundResults);
        }
        break;
      }

      case 'draw:stroke': {
        const { stroke } = msg.payload || {};
        if (this.currentRoom.state === 'playing' && this.currentRoom.currentMiniGame === 'draw_guess') {
          this.currentRoom.drawingStrokes.push(stroke);
          // Broadcast to all other peers
          this.hostConnections.forEach((otherConn, otherId) => {
            if (otherId !== fromPlayerId && otherConn.open) {
              otherConn.send({ type: 'draw:stroke_received', payload: stroke });
            }
          });
          this.emitLocal('draw:stroke_received', stroke);
        }
        break;
      }

      case 'draw:clear': {
        if (this.currentRoom.state === 'playing') {
          this.currentRoom.drawingStrokes = [];
          this.broadcastRoomUpdate();
        }
        break;
      }

      case 'room:leave': {
        if (this.currentRoom.players[fromPlayerId]) {
          delete this.currentRoom.players[fromPlayerId];
          this.hostConnections.delete(fromPlayerId);
          this.broadcastRoomUpdate();
        }
        break;
      }
    }
  }

  // ==========================================
  // PUBLIC ACTIONS (CREATE, JOIN, ACTIONS)
  // ==========================================

  public async createRoom(
    nickname: string,
    avatar: string
  ): Promise<{ success: boolean; roomCode?: string; playerId?: string; room?: RoomData; error?: string }> {
    return new Promise((resolve) => {
      const roomCode = generateRoomCode();
      const peerId = `lodeks-p2p-${roomCode.toLowerCase()}`;
      const hostPlayerId = `host_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const hostPlayer: Player = {
        id: hostPlayerId,
        socketId: peerId,
        nickname: nickname.trim().slice(0, 15) || 'المضيف',
        avatar: avatar || getRandomAvatar(),
        score: 0,
        roundScore: 0,
        isHost: true,
        isConnected: true,
        isReady: true,
        team: 1,
        correctGuessesCount: 0,
        riddleWins: 0,
        drawingsWon: 0,
        penalties: 0,
      };

      const newRoom: RoomData = {
        code: roomCode,
        hostId: hostPlayerId,
        players: { [hostPlayerId]: hostPlayer },
        state: 'lobby',
        currentRound: 0,
        totalRounds: 12,
        gameHistory: [],
        currentMiniGame: null,
        roundStartTime: 0,
        roundEndTime: 0,
        roundDuration: 0,
        roundData: null,
        drawingStrokes: [],
        chatMessages: [],
        lastRoundResults: null,
      };

      this.isHost = true;
      this.currentRoom = newRoom;
      this.currentPlayerId = hostPlayerId;

      try {
        if (this.peer) {
          this.peer.destroy();
        }

        this.peer = new Peer(peerId, PEER_CONFIG);

        this.peer.on('open', (id) => {
          console.log('[RealtimeClient] P2P Host open with ID:', id);
          this.emitLocal('room:update', { ...newRoom });
          resolve({
            success: true,
            roomCode,
            playerId: hostPlayerId,
            room: newRoom,
          });
        });

        this.peer.on('connection', (conn) => {
          let assignedPlayerId: string | null = null;

          conn.on('data', (data: any) => {
            const msg = data as PeerMessage;
            if (msg.type === 'room:join') {
              assignedPlayerId = msg.payload?.existingPlayerId || `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
              this.handleHostReceivedMessage(assignedPlayerId, conn, msg);
            } else if (assignedPlayerId) {
              this.handleHostReceivedMessage(assignedPlayerId, conn, msg);
            }
          });

          conn.on('close', () => {
            if (assignedPlayerId && this.currentRoom && this.currentRoom.players[assignedPlayerId]) {
              this.currentRoom.players[assignedPlayerId].isConnected = false;
              this.broadcastRoomUpdate();
            }
          });

          conn.on('error', (err) => {
            console.warn('[RealtimeClient] Peer connection error:', err);
          });
        });

        this.peer.on('error', (err: any) => {
          console.warn('[RealtimeClient] Peer Host notice:', err);
          // If ID is taken, we still resolve and room works locally
          if (err.type === 'unavailable-id') {
            resolve({
              success: true,
              roomCode,
              playerId: hostPlayerId,
              room: newRoom,
            });
          } else {
            // Still resolve successfully so game never gets stuck in loading!
            resolve({
              success: true,
              roomCode,
              playerId: hostPlayerId,
              room: newRoom,
            });
          }
        });
      } catch (err) {
        console.error('[RealtimeClient] Create room peer error:', err);
        resolve({
          success: true,
          roomCode,
          playerId: hostPlayerId,
          room: newRoom,
        });
      }

      // Also notify socket server if running
      if (this.socket && this.socket.connected) {
        this.socket.emit('room:create', { nickname, avatar });
      }
    });
  }

  public async joinRoom(
    roomCode: string,
    nickname: string,
    avatar: string,
    existingPlayerId?: string
  ): Promise<{ success: boolean; roomCode?: string; playerId?: string; room?: RoomData; error?: string }> {
    return new Promise((resolve) => {
      const cleanCode = roomCode.toUpperCase().trim();
      const hostPeerId = `lodeks-p2p-${cleanCode.toLowerCase()}`;
      const myPeerId = `lodeks-player-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      this.isHost = false;

      try {
        if (this.peer) {
          this.peer.destroy();
        }

        this.peer = new Peer(myPeerId, PEER_CONFIG);

        let timeoutHandle: any = null;
        let isResolved = false;

        const finishJoin = (data: { success: boolean; playerId?: string; room?: RoomData; error?: string }) => {
          if (isResolved) return;
          isResolved = true;
          if (timeoutHandle) clearTimeout(timeoutHandle);

          if (data.success && data.playerId && data.room) {
            this.currentPlayerId = data.playerId;
            this.currentRoom = data.room;
            this.emitLocal('room:update', data.room);
            resolve({
              success: true,
              roomCode: cleanCode,
              playerId: data.playerId,
              room: data.room,
            });
          } else {
            resolve({
              success: false,
              error: data.error || 'تعذر العثور على الغرفة! تأكد من إدخال الرمز الصحيح.',
            });
          }
        };

        // Fallback timeout
        timeoutHandle = setTimeout(() => {
          if (!isResolved) {
            // Attempt socket fallback
            if (this.socket && this.socket.connected) {
              this.socket.emit(
                'room:join',
                { roomCode: cleanCode, nickname, avatar, existingPlayerId },
                (res: any) => {
                  finishJoin(res || { success: false, error: 'تعذر الاتصال بالغرفة.' });
                }
              );
            } else {
              finishJoin({ success: false, error: 'لم نتمكن من الاتصال بمضيف الغرفة. تأكد من أن المضيف متصل والرمز صحيح.' });
            }
          }
        }, 6000);

        this.peer.on('open', () => {
          console.log('[RealtimeClient] Connecting to host peer:', hostPeerId);
          const conn = this.peer!.connect(hostPeerId, { reliable: true });
          this.clientConnection = conn;

          conn.on('open', () => {
            console.log('[RealtimeClient] Connected to Host WebRTC data channel!');
            conn.send({
              type: 'room:join',
              payload: {
                nickname,
                avatar,
                existingPlayerId,
              },
            });
          });

          conn.on('data', (data: any) => {
            const msg = data as PeerMessage;
            if (msg.type === 'room:join_ack') {
              finishJoin(msg.payload);
            } else if (msg.type === 'room:update') {
              this.currentRoom = msg.payload;
              this.emitLocal('room:update', msg.payload);
            } else if (msg.type === 'game:timer') {
              this.emitLocal('game:timer', msg.payload);
            } else if (msg.type === 'game:round_started') {
              this.emitLocal('game:round_started', msg.payload);
            } else if (msg.type === 'game:round_ended') {
              this.emitLocal('game:round_ended', msg.payload);
            } else if (msg.type === 'game:answer_result') {
              this.emitLocal('game:answer_result', msg.payload);
            } else if (msg.type === 'draw:stroke_received') {
              this.emitLocal('draw:stroke_received', msg.payload);
            }
          });

          conn.on('close', () => {
            console.warn('[RealtimeClient] Host connection closed.');
          });

          conn.on('error', (err) => {
            console.warn('[RealtimeClient] Connection to host error:', err);
            finishJoin({ success: false, error: 'حدث خطأ أثناء الاتصال بالمضيف.' });
          });
        });

        this.peer.on('error', (err) => {
          console.warn('[RealtimeClient] Client Peer error:', err);
          finishJoin({ success: false, error: 'تأكد من رمز الغرفة أو اتصال الإنترنت.' });
        });
      } catch (err) {
        console.error('[RealtimeClient] Join peer exception:', err);
        resolve({ success: false, error: 'تعذر الانضمام للغرفة.' });
      }
    });
  }

  public toggleReady() {
    if (this.isHost && this.currentRoom && this.currentPlayerId) {
      if (this.currentRoom.players[this.currentPlayerId]) {
        this.currentRoom.players[this.currentPlayerId].isReady = !this.currentRoom.players[this.currentPlayerId].isReady;
        this.broadcastRoomUpdate();
      }
    } else {
      this.sendToHost('player:ready');
    }
  }

  public changeTeam(team: 1 | 2) {
    if (this.isHost && this.currentRoom && this.currentPlayerId) {
      if (this.currentRoom.players[this.currentPlayerId] && this.currentRoom.state === 'lobby') {
        this.currentRoom.players[this.currentPlayerId].team = team;
        this.broadcastRoomUpdate();
      }
    } else {
      this.sendToHost('player:team', { team });
    }
  }

  public startGame() {
    if (this.isHost && this.currentRoom) {
      this.currentRoom.currentRound = 0;
      this.currentRoom.gameHistory = [];
      Object.values(this.currentRoom.players).forEach((p) => {
        p.score = 0;
        p.roundScore = 0;
      });
      this.startRound();
    } else {
      this.sendToHost('game:start');
    }
  }

  public nextRound() {
    if (this.isHost && this.currentRoom) {
      this.startRound();
    } else {
      this.sendToHost('game:next_round');
    }
  }

  public playAgain() {
    if (this.isHost && this.currentRoom) {
      this.currentRoom.state = 'lobby';
      this.currentRoom.currentRound = 0;
      this.currentRoom.gameHistory = [];
      Object.values(this.currentRoom.players).forEach((p) => {
        p.score = 0;
        p.roundScore = 0;
        p.isReady = false;
      });
      this.broadcastRoomUpdate();
    } else {
      this.sendToHost('game:play_again');
    }
  }

  public sendAnswer(answer: string) {
    if (this.isHost && this.currentRoom && this.currentPlayerId) {
      const { isCorrect, roundEnded } = handleAnswerLogic(this.currentRoom, this.currentPlayerId, answer);
      this.emitLocal('game:answer_result', { correct: isCorrect, playerId: this.currentPlayerId });

      if (roundEnded) {
        this.clearHostTimers();
        this.broadcastRoomUpdate();
        this.emitLocal('game:round_ended', this.currentRoom.lastRoundResults);
        this.broadcastToPeers('game:round_ended', this.currentRoom.lastRoundResults);
      }
    } else {
      this.sendToHost('game:answer', { answer });
    }
  }

  public sendStroke(stroke: DrawingStroke) {
    if (this.isHost && this.currentRoom) {
      this.currentRoom.drawingStrokes.push(stroke);
      this.broadcastToPeers('draw:stroke_received', stroke);
      this.emitLocal('draw:stroke_received', stroke);
    } else {
      this.sendToHost('draw:stroke', { stroke });
    }
  }

  public clearCanvas() {
    if (this.isHost && this.currentRoom) {
      this.currentRoom.drawingStrokes = [];
      this.broadcastRoomUpdate();
    } else {
      this.sendToHost('draw:clear');
    }
  }

  public leaveRoom() {
    this.clearHostTimers();
    if (this.isHost) {
      if (this.peer) this.peer.destroy();
    } else {
      this.sendToHost('room:leave');
      if (this.clientConnection) this.clientConnection.close();
      if (this.peer) this.peer.destroy();
    }
    this.currentRoom = null;
    this.currentPlayerId = null;
    this.isHost = false;
  }
}

export const realtimeClient = new RealtimeClient();

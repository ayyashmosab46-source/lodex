import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { Server as SocketIOServer, Socket } from 'socket.io';
import {
  MiniGameType,
  RoomData,
  Player,
  DrawingStroke,
  ChatMessage,
  RoundResultData,
} from './src/types/game';
import {
  RIDDLES_DATA,
  SOUNDS_DATA,
  CLUES_DATA,
  DRAW_WORDS,
  WHO_AM_I_DATA,
  WHAT_HAPPENED_DATA,
  FALCON_EYE_DATA,
  MEMORY_DATA,
  RiddleItem,
  SoundItem,
  ClueItem,
  DrawWordItem,
  WhoAmIItem,
  WhatHappenedItem,
  FalconEyeItem,
  MemoryGameItem,
} from './src/data/content';
import { isArabicMatch } from './src/utils/arabic';

const app = express();
app.use(express.json());

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

const PORT = 3000;

// Rooms storage
const rooms: Record<string, RoomData> = {};
const roomTimers: Record<string, NodeJS.Timeout> = {};

const MINI_GAMES: MiniGameType[] = [
  'riddles',
  'sound_guess',
  'what_happened',
  'combine_clues',
  'draw_guess',
  'who_am_i',
  'falcon_eye',
  'memory_game',
];

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms[code] ? generateRoomCode() : code;
}

function getRandomAvatar(): string {
  const avatars = ['🦁', '🦅', '🐺', '🦊', '🐯', '🐼', '🦄', '🐲', '🚀', '👑', '⚡', '🔥'];
  return avatars[Math.floor(Math.random() * avatars.length)];
}

function broadcastRoom(roomCode: string) {
  const room = rooms[roomCode];
  if (room) {
    io.to(roomCode).emit('room:update', room);
  }
}

function clearRoomTimer(roomCode: string) {
  if (roomTimers[roomCode]) {
    clearInterval(roomTimers[roomCode]);
    delete roomTimers[roomCode];
  }
}

// Start a game round
function startRound(roomCode: string) {
  const room = rooms[roomCode];
  if (!room) return;

  clearRoomTimer(roomCode);
  room.currentRound += 1;

  if (room.currentRound > room.totalRounds) {
    // Game Over
    room.state = 'final_results';
    broadcastRoom(roomCode);
    return;
  }

  // Pick next mini game in balanced rotation
  const availableGames = MINI_GAMES.filter((g) => {
    const playedCount = room.gameHistory.filter((h) => h === g).length;
    return playedCount < Math.ceil(room.totalRounds / MINI_GAMES.length);
  });

  const nextGame: MiniGameType =
    availableGames.length > 0
      ? availableGames[Math.floor(Math.random() * availableGames.length)]
      : MINI_GAMES[Math.floor(Math.random() * MINI_GAMES.length)];

  room.currentMiniGame = nextGame;
  room.gameHistory.push(nextGame);
  room.state = 'round_intro';
  room.drawingStrokes = [];
  room.chatMessages = [];
  room.lastRoundResults = null;

  // Prepare Round Data
  prepareRoundData(room, nextGame);
  broadcastRoom(roomCode);

  // Transition from Intro to Playing after 3.5 seconds
  setTimeout(() => {
    const currentRoom = rooms[roomCode];
    if (!currentRoom || currentRoom.state !== 'round_intro') return;

    const startingTeam: 1 | 2 = currentRoom.currentRound % 2 === 1 ? 1 : 2;
    currentRoom.state = 'playing';
    currentRoom.activeTeam = startingTeam;
    currentRoom.teamTurnPhase = 1;
    currentRoom.teamTimeLeft = 30;
    currentRoom.roundDuration = 60;
    currentRoom.roundStartTime = Date.now();
    currentRoom.roundEndTime = currentRoom.roundStartTime + 60 * 1000;

    broadcastRoom(roomCode);
    io.to(roomCode).emit('game:round_started');

    // Run Round Timer
    let teamTime = 30;
    let phase: 1 | 2 = 1;

    io.to(roomCode).emit('game:timer', {
      timeLeft: teamTime,
      activeTeam: currentRoom.activeTeam,
      phase,
    });

    roomTimers[roomCode] = setInterval(() => {
      teamTime -= 1;
      currentRoom.teamTimeLeft = Math.max(0, teamTime);

      // Special handler for WhoAmI clues progressive reveal
      if (nextGame === 'who_am_i' && currentRoom.roundData) {
        if (teamTime === 20 && currentRoom.roundData.unlockedCluesCount < 2) {
          currentRoom.roundData.unlockedCluesCount = 2;
          currentRoom.roundData.currentPoints = 75;
          broadcastRoom(roomCode);
        } else if (teamTime === 10 && currentRoom.roundData.unlockedCluesCount < 3) {
          currentRoom.roundData.unlockedCluesCount = 3;
          currentRoom.roundData.currentPoints = 50;
          broadcastRoom(roomCode);
        }
      }

      io.to(roomCode).emit('game:timer', {
        timeLeft: Math.max(0, teamTime),
        activeTeam: currentRoom.activeTeam,
        phase,
      });

      if (teamTime <= 0) {
        if (phase === 1) {
          phase = 2;
          teamTime = 30;
          const secondTeam: 1 | 2 = startingTeam === 1 ? 2 : 1;
          currentRoom.activeTeam = secondTeam;
          currentRoom.teamTurnPhase = 2;
          currentRoom.teamTimeLeft = 30;
          broadcastRoom(roomCode);
        } else {
          clearRoomTimer(roomCode);
          endRound(roomCode, null); // Time out with no winner
        }
      }
    }, 1000);
  }, 3500);
}

function getRoundDuration(gameType: MiniGameType): number {
  switch (gameType) {
    case 'riddles':
      return 30;
    case 'sound_guess':
      return 25;
    case 'what_happened':
      return 25;
    case 'combine_clues':
      return 30;
    case 'draw_guess':
      return 45;
    case 'who_am_i':
      return 30;
    case 'falcon_eye':
      return 30;
    case 'memory_game':
      return 30;
    default:
      return 30;
  }
}

function prepareRoundData(room: RoomData, gameType: MiniGameType) {
  const playersList = Object.values(room.players);

  switch (gameType) {
    case 'riddles': {
      const item = RIDDLES_DATA[Math.floor(Math.random() * RIDDLES_DATA.length)];
      const shuffledOptions = item.options ? [...item.options].sort(() => Math.random() - 0.5) : undefined;
      room.roundData = {
        id: item.id,
        question: item.question,
        options: shuffledOptions,
        _answer: item.answer,
        _aliases: item.aliases,
      };
      break;
    }
    case 'sound_guess': {
      const item = SOUNDS_DATA[Math.floor(Math.random() * SOUNDS_DATA.length)];
      const shuffledOptions = item.options ? [...item.options].sort(() => Math.random() - 0.5) : undefined;
      room.roundData = {
        id: item.id,
        title: item.title,
        soundKey: item.soundKey,
        category: item.category,
        options: shuffledOptions,
        _answer: item.answer,
        _aliases: item.aliases,
      };
      break;
    }
    case 'what_happened': {
      const item = WHAT_HAPPENED_DATA[Math.floor(Math.random() * WHAT_HAPPENED_DATA.length)];
      const correctAns = item.options[item.correctOptionIndex];
      const shuffledOptions = [...item.options].sort(() => Math.random() - 0.5);
      const newCorrectIndex = shuffledOptions.indexOf(correctAns);
      room.roundData = {
        id: item.id,
        showTitle: item.showTitle,
        showPoster: item.showPoster,
        sceneDescription: item.sceneDescription,
        question: item.question,
        options: shuffledOptions,
        _correctOptionIndex: newCorrectIndex,
        _correctAnswer: correctAns,
        _explanation: item.explanation,
        _answer: correctAns,
        _aliases: [],
      };
      break;
    }
    case 'combine_clues': {
      const item = CLUES_DATA[Math.floor(Math.random() * CLUES_DATA.length)];
      const shuffledOptions = item.options ? [...item.options].sort(() => Math.random() - 0.5) : undefined;
      room.roundData = {
        id: item.id,
        theme: item.theme,
        clues: item.clues,
        options: shuffledOptions,
        _answer: item.answer,
        _aliases: item.aliases,
      };
      break;
    }
    case 'draw_guess': {
      const item = DRAW_WORDS[Math.floor(Math.random() * DRAW_WORDS.length)];
      const activePlayers = playersList.filter((p) => p.team === room.activeTeam);
      const drawer =
        (activePlayers.length > 0
          ? activePlayers[Math.floor(Math.random() * activePlayers.length)]
          : playersList[Math.floor(Math.random() * playersList.length)]) || {
          id: room.hostId,
          nickname: 'الرسام',
        };
      room.roundData = {
        drawerId: drawer.id,
        drawerNickname: drawer.nickname,
        wordToDraw: item.word,
        category: item.category,
        _answer: item.word,
        _aliases: item.aliases,
      };
      break;
    }
    case 'who_am_i': {
      const item = WHO_AM_I_DATA[Math.floor(Math.random() * WHO_AM_I_DATA.length)];
      const shuffledOptions = item.options ? [...item.options].sort(() => Math.random() - 0.5) : undefined;
      room.roundData = {
        id: item.id,
        category: item.category,
        clues: item.clues,
        options: shuffledOptions,
        unlockedCluesCount: 1,
        currentPoints: 100,
        _answer: item.characterName,
        _aliases: item.aliases,
        _description: item.description,
      };
      break;
    }
    case 'falcon_eye': {
      const item = FALCON_EYE_DATA[Math.floor(Math.random() * FALCON_EYE_DATA.length)];
      const correctAns = item.options[item.correctOptionIndex];
      const shuffledOptions = [...item.options].sort(() => Math.random() - 0.5);
      const newCorrectIndex = shuffledOptions.indexOf(correctAns);
      room.roundData = {
        id: item.id,
        title: item.title,
        category: item.category,
        sceneIcon: item.sceneIcon,
        sceneDescription: item.sceneDescription,
        visualGrid: item.visualGrid,
        question: item.question,
        options: shuffledOptions,
        _correctOptionIndex: newCorrectIndex,
        _correctAnswer: correctAns,
        _explanation: item.explanation,
        _answer: item.answer,
        _aliases: item.aliases,
      };
      break;
    }
    case 'memory_game': {
      const item = MEMORY_DATA[Math.floor(Math.random() * MEMORY_DATA.length)];
      const correctAns = item.options[item.correctOptionIndex];
      const shuffledOptions = [...item.options].sort(() => Math.random() - 0.5);
      const newCorrectIndex = shuffledOptions.indexOf(correctAns);
      room.roundData = {
        id: item.id,
        title: item.title,
        category: item.category,
        itemsToMemorize: item.itemsToMemorize,
        question: item.question,
        options: shuffledOptions,
        _correctOptionIndex: newCorrectIndex,
        _correctAnswer: correctAns,
        _explanation: item.explanation,
        _answer: item.answer,
        _aliases: item.aliases,
      };
      break;
    }
  }
}

function endRound(roomCode: string, winnerPlayerId: string | null, customExplanation?: string) {
  const room = rooms[roomCode];
  if (!room) return;

  clearRoomTimer(roomCode);

  const pointsAwarded: Record<string, number> = {};
  let correctAnswer = '';
  let explanation = customExplanation || '';

  if (room.roundData) {
    correctAnswer =
      room.roundData._correctAnswer || room.roundData._answer || room.roundData.wordToDraw || '';
    if (!explanation && room.roundData._explanation) {
      explanation = room.roundData._explanation;
    }
    if (!explanation && room.roundData._description) {
      explanation = room.roundData._description;
    }
  }

  if (winnerPlayerId && room.players[winnerPlayerId]) {
    const winner = room.players[winnerPlayerId];
    let pts = 100;

    if (room.currentMiniGame === 'who_am_i' && room.roundData?.currentPoints) {
      pts = room.roundData.currentPoints;
    }

    winner.score += pts;
    winner.correctGuessesCount = (winner.correctGuessesCount || 0) + 1;
    pointsAwarded[winner.id] = pts;

    // In draw_guess, also award drawer points
    if (room.currentMiniGame === 'draw_guess' && room.roundData?.drawerId) {
      const drawer = room.players[room.roundData.drawerId];
      if (drawer && drawer.id !== winner.id) {
        const drawerPts = 50;
        drawer.score += drawerPts;
        drawer.drawingsWon = (drawer.drawingsWon || 0) + 1;
        pointsAwarded[drawer.id] = drawerPts;
      }
    }
  }

  const playersList = Object.values(room.players);
  const team1Score = playersList.filter((p) => p.team === 1).reduce((acc, p) => acc + p.score, 0);
  const team2Score = playersList.filter((p) => p.team === 2).reduce((acc, p) => acc + p.score, 0);

  const roundResults: RoundResultData = {
    winnerPlayerId,
    winnerTeam: winnerPlayerId ? room.players[winnerPlayerId]?.team || null : null,
    correctAnswer,
    pointsAwarded,
    explanation,
    team1Score,
    team2Score,
  };

  room.lastRoundResults = roundResults;
  room.state = 'round_result';

  broadcastRoom(roomCode);
  io.to(roomCode).emit('game:round_ended', roundResults);
}

// Socket handlers
io.on('connection', (socket: Socket) => {
  let currentRoomCode: string | null = null;
  let currentPlayerId: string | null = null;

  // Create Room
  socket.on('room:create', ({ nickname, avatar }, callback) => {
    const cleanNick = ((nickname as string) || 'لاعب').trim().slice(0, 15);
    const roomCode = generateRoomCode();
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const hostPlayer: Player = {
      id: playerId,
      socketId: socket.id,
      nickname: cleanNick,
      avatar: (avatar as string) || getRandomAvatar(),
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
      hostId: playerId,
      players: { [playerId]: hostPlayer },
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

    rooms[roomCode] = newRoom;
    currentRoomCode = roomCode;
    currentPlayerId = playerId;

    socket.join(roomCode);
    if (typeof callback === 'function') {
      callback({ success: true, roomCode, playerId, room: newRoom });
    }
    broadcastRoom(roomCode);
  });

  // Join Room
  socket.on('room:join', ({ roomCode, nickname, avatar, existingPlayerId }, callback) => {
    const code = ((roomCode as string) || '').toUpperCase().trim();
    const room = rooms[code];

    if (!room) {
      if (typeof callback === 'function') {
        callback({ success: false, error: 'الغرفة غير موجودة! تأكد من الرمز.' });
      }
      return;
    }

    const currentPlayers = Object.values(room.players);

    // Reconnection
    if (existingPlayerId && room.players[existingPlayerId]) {
      const p = room.players[existingPlayerId];
      p.socketId = socket.id;
      p.isConnected = true;
      currentRoomCode = code;
      currentPlayerId = existingPlayerId;
      socket.join(code);

      if (typeof callback === 'function') {
        callback({ success: true, roomCode: code, playerId: existingPlayerId, room });
      }
      broadcastRoom(code);
      return;
    }

    if (currentPlayers.length >= 8) {
      if (typeof callback === 'function') {
        callback({ success: false, error: 'الغرفة ممتلئة! الحد الأقصى 8 لاعبين.' });
      }
      return;
    }

    if (room.state !== 'lobby') {
      if (typeof callback === 'function') {
        callback({ success: false, error: 'المباراة قد بدأت بالفعل!' });
      }
      return;
    }

    const cleanNick = ((nickname as string) || `لاعب ${currentPlayers.length + 1}`).trim().slice(0, 15);
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Balance teams
    const team1Count = currentPlayers.filter((p) => p.team === 1).length;
    const team2Count = currentPlayers.filter((p) => p.team === 2).length;
    const assignedTeam: 1 | 2 = team1Count <= team2Count ? 1 : 2;

    const newPlayer: Player = {
      id: playerId,
      socketId: socket.id,
      nickname: cleanNick,
      avatar: (avatar as string) || getRandomAvatar(),
      score: 0,
      roundScore: 0,
      isHost: false,
      isConnected: true,
      isReady: false,
      team: assignedTeam,
      correctGuessesCount: 0,
      riddleWins: 0,
      drawingsWon: 0,
      penalties: 0,
    };

    room.players[playerId] = newPlayer;
    currentRoomCode = code;
    currentPlayerId = playerId;

    socket.join(code);
    if (typeof callback === 'function') {
      callback({ success: true, roomCode: code, playerId, room });
    }
    broadcastRoom(code);
  });

  // Ready Toggle
  socket.on('player:ready', () => {
    if (!currentRoomCode || !currentPlayerId) return;
    const room = rooms[currentRoomCode];
    if (room && room.players[currentPlayerId]) {
      room.players[currentPlayerId].isReady = !room.players[currentPlayerId].isReady;
      broadcastRoom(currentRoomCode);
    }
  });

  // Team Switch
  socket.on('player:team', ({ team }: { team: 1 | 2 }) => {
    if (!currentRoomCode || !currentPlayerId) return;
    const room = rooms[currentRoomCode];
    if (room && room.players[currentPlayerId] && room.state === 'lobby') {
      room.players[currentPlayerId].team = team === 1 ? 1 : 2;
      broadcastRoom(currentRoomCode);
    }
  });

  // Start Game
  socket.on('game:start', () => {
    if (!currentRoomCode || !currentPlayerId) return;
    const room = rooms[currentRoomCode];
    if (room && room.hostId === currentPlayerId && room.state === 'lobby') {
      room.currentRound = 0;
      room.gameHistory = [];
      Object.values(room.players).forEach((p) => {
        p.score = 0;
        p.roundScore = 0;
      });
      startRound(currentRoomCode);
    }
  });

  // Next Round
  socket.on('game:next_round', () => {
    if (!currentRoomCode || !currentPlayerId) return;
    const room = rooms[currentRoomCode];
    if (room && room.hostId === currentPlayerId && room.state === 'round_result') {
      startRound(currentRoomCode);
    }
  });

  // Play Again
  socket.on('game:play_again', () => {
    if (!currentRoomCode || !currentPlayerId) return;
    const room = rooms[currentRoomCode];
    if (room && room.hostId === currentPlayerId && room.state === 'final_results') {
      room.state = 'lobby';
      room.currentRound = 0;
      room.gameHistory = [];
      Object.values(room.players).forEach((p) => {
        p.score = 0;
        p.roundScore = 0;
        p.isReady = false;
      });
      broadcastRoom(currentRoomCode);
    }
  });

  // Handle Answers
  socket.on('game:answer', ({ answer }: { answer: string }) => {
    if (!currentRoomCode || !currentPlayerId) return;
    const room = rooms[currentRoomCode];
    if (!room || room.state !== 'playing' || !room.roundData) return;

    const player = room.players[currentPlayerId];
    if (!player) return;

    // Only active team can answer (except drawer in draw_guess)
    if (room.currentMiniGame !== 'draw_guess') {
      if (room.activeTeam && player.team !== room.activeTeam) {
        return;
      }
    }

    // In draw_guess, drawer cannot answer
    if (room.currentMiniGame === 'draw_guess' && room.roundData.drawerId === player.id) {
      return;
    }

    let isCorrect = false;

    if (
      room.currentMiniGame === 'what_happened' ||
      room.currentMiniGame === 'falcon_eye' ||
      room.currentMiniGame === 'memory_game'
    ) {
      const chosenIdx = parseInt(answer, 10);
      if (!isNaN(chosenIdx) && chosenIdx === room.roundData._correctOptionIndex) {
        isCorrect = true;
      } else if (
        room.roundData._correctAnswer &&
        isArabicMatch(answer, room.roundData._correctAnswer, room.roundData._aliases || [])
      ) {
        isCorrect = true;
      } else {
        const target = room.roundData._answer || '';
        const aliases = room.roundData._aliases || [];
        isCorrect = isArabicMatch(answer, target, aliases);
      }
    } else {
      const target = room.roundData._answer || room.roundData.wordToDraw || '';
      const aliases = room.roundData._aliases || [];
      isCorrect = isArabicMatch(answer, target, aliases);
    }

    socket.emit('game:answer_result', { correct: isCorrect, playerId: player.id });

    if (isCorrect) {
      endRound(currentRoomCode, player.id);
    }
  });

  // Draw stroke
  socket.on('draw:stroke', ({ stroke }: { stroke: DrawingStroke }) => {
    if (!currentRoomCode) return;
    const room = rooms[currentRoomCode];
    if (room && room.state === 'playing' && room.currentMiniGame === 'draw_guess') {
      room.drawingStrokes.push(stroke);
      socket.to(currentRoomCode).emit('draw:stroke_received', stroke);
      broadcastRoom(currentRoomCode);
    }
  });

  // Draw clear
  socket.on('draw:clear', () => {
    if (!currentRoomCode) return;
    const room = rooms[currentRoomCode];
    if (room && room.state === 'playing') {
      room.drawingStrokes = [];
      broadcastRoom(currentRoomCode);
    }
  });

  // Leave room
  socket.on('room:leave', () => {
    if (!currentRoomCode || !currentPlayerId) return;
    const room = rooms[currentRoomCode];
    if (room) {
      delete room.players[currentPlayerId];
      if (Object.keys(room.players).length === 0) {
        clearRoomTimer(currentRoomCode);
        delete rooms[currentRoomCode];
      } else {
        if (room.hostId === currentPlayerId) {
          room.hostId = Object.keys(room.players)[0];
          room.players[room.hostId].isHost = true;
        }
        broadcastRoom(currentRoomCode);
      }
    }
  });

  socket.on('disconnect', () => {
    if (currentRoomCode && currentPlayerId) {
      const room = rooms[currentRoomCode];
      if (room && room.players[currentPlayerId]) {
        room.players[currentPlayerId].isConnected = false;
        broadcastRoom(currentRoomCode);
      }
    }
  });
});

async function startServer() {
  // REST API Health & Status
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      version: '1.0.0',
      activeRooms: Object.keys(rooms).length,
      serverTime: Date.now(),
    });
  });

  // REST API: Get Room Info
  app.get('/api/rooms/:code', (req, res) => {
    const code = (req.params.code || '').toUpperCase().trim();
    const room = rooms[code];
    if (!room) {
      return res.status(404).json({ success: false, error: 'الغرفة غير موجودة!' });
    }
    return res.json({
      success: true,
      roomCode: code,
      playerCount: Object.keys(room.players).length,
      state: room.state,
      currentRound: room.currentRound,
      totalRounds: room.totalRounds,
    });
  });

  // REST API: Create Room Fallback
  app.post('/api/rooms/create', (req, res) => {
    const { nickname, avatar } = req.body || {};
    const cleanNick = ((nickname as string) || 'لاعب').trim().slice(0, 15);
    const roomCode = generateRoomCode();
    const playerId = `rest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const hostPlayer: Player = {
      id: playerId,
      socketId: '',
      nickname: cleanNick,
      avatar: (avatar as string) || getRandomAvatar(),
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
      hostId: playerId,
      players: { [playerId]: hostPlayer },
      state: 'lobby',
      currentRound: 0,
      totalRounds: 10,
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

    rooms[roomCode] = newRoom;
    return res.json({
      success: true,
      roomCode,
      playerId,
      room: newRoom,
    });
  });

  // REST API: Join Room Fallback
  app.post('/api/rooms/join', (req, res) => {
    const { roomCode, nickname, avatar, existingPlayerId } = req.body || {};
    const code = ((roomCode as string) || '').toUpperCase().trim();
    const room = rooms[code];

    if (!room) {
      return res.status(404).json({ success: false, error: 'الغرفة غير موجودة! تأكد من الرمز.' });
    }

    const currentPlayers = Object.values(room.players);

    if (existingPlayerId && room.players[existingPlayerId]) {
      const p = room.players[existingPlayerId];
      p.isConnected = true;
      return res.json({ success: true, roomCode: code, playerId: existingPlayerId, room });
    }

    if (currentPlayers.length >= 8) {
      return res.status(400).json({ success: false, error: 'الغرفة ممتلئة! الحد الأقصى 8 لاعبين.' });
    }

    if (room.state !== 'lobby') {
      return res.status(400).json({ success: false, error: 'المباراة قد بدأت بالفعل!' });
    }

    const cleanNick = ((nickname as string) || `لاعب ${currentPlayers.length + 1}`).trim().slice(0, 15);
    const playerId = `rest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const team1Count = currentPlayers.filter((p) => p.team === 1).length;
    const team2Count = currentPlayers.filter((p) => p.team === 2).length;
    const assignedTeam: 1 | 2 = team1Count <= team2Count ? 1 : 2;

    const newPlayer: Player = {
      id: playerId,
      socketId: '',
      nickname: cleanNick,
      avatar: (avatar as string) || getRandomAvatar(),
      score: 0,
      roundScore: 0,
      isHost: false,
      isConnected: true,
      isReady: false,
      team: assignedTeam,
      correctGuessesCount: 0,
      riddleWins: 0,
      drawingsWon: 0,
      penalties: 0,
    };

    room.players[playerId] = newPlayer;
    broadcastRoom(code);

    return res.json({
      success: true,
      roomCode: code,
      playerId,
      room,
    });
  });

  // Serve static assets in prod / Vite in dev
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    let distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(path.join(distPath, 'index.html')) && typeof __dirname !== 'undefined') {
      if (fs.existsSync(path.join(__dirname, 'index.html'))) {
        distPath = __dirname;
      } else if (fs.existsSync(path.join(__dirname, '..', 'dist', 'index.html'))) {
        distPath = path.join(__dirname, '..', 'dist');
      }
    }

    if (fs.existsSync(path.join(distPath, 'index.html'))) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      // Fallback to Vite dev server if dist build is missing even in production
      try {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: 'spa',
        });
        app.use(vite.middlewares);
      } catch (err) {
        console.warn('Vite fallback load notice:', err);
      }
    }
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[LODEKS Server] Ready and listening on port ${PORT}`);
  });

  server.on('error', (err) => {
    console.error('[LODEKS Server] Server socket error:', err);
  });
}

process.on('uncaughtException', (err) => {
  console.error('[LODEKS Server] Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[LODEKS Server] Unhandled rejection at:', promise, 'reason:', reason);
});

startServer();

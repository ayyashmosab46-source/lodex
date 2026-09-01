import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { RoomData, Player, MiniGameType, DrawingStroke, ChatMessage } from './types/game';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { LobbyView } from './components/LobbyView';
import { RoundIntroView } from './components/RoundIntroView';
import { RoundResultView } from './components/RoundResultView';
import { FinalResultsView } from './components/FinalResultsView';
import { RiddlesGame } from './components/minigames/RiddlesGame';
import { SoundGuessGame } from './components/minigames/SoundGuessGame';
import { WhatHappenedGame } from './components/minigames/WhatHappenedGame';
import { CombineCluesGame } from './components/minigames/CombineCluesGame';
import { DrawAndGuessGame } from './components/minigames/DrawAndGuessGame';
import { WhoAmIGame } from './components/minigames/WhoAmIGame';
import { getBackendUrl } from './utils/config';
import { soundManager } from './utils/audio';

export function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(() => {
    return localStorage.getItem('lodeks_player_id') || null;
  });
  const [roundTimeLeft, setRoundTimeLeft] = useState<number>(30);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const roomRef = useRef<RoomData | null>(null);
  const playerIdRef = useRef<string | null>(null);
  roomRef.current = room;
  playerIdRef.current = playerId;

  // Persist playerId
  useEffect(() => {
    if (playerId) {
      localStorage.setItem('lodeks_player_id', playerId);
    }
  }, [playerId]);

  // Initialize Socket.io client
  useEffect(() => {
    const backendUrl = getBackendUrl();
    const s = io(backendUrl || undefined, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 30,
      reconnectionDelay: 1000,
      timeout: 15000,
      withCredentials: true,
    });

    s.on('connect', () => {
      console.log('[LODEKS] Socket connected:', s.id);
      setErrorMessage('');
      if (roomRef.current && playerIdRef.current) {
        s.emit('room:join', {
          roomCode: roomRef.current.code,
          nickname: roomRef.current.players[playerIdRef.current]?.nickname || 'لاعب',
          avatar: roomRef.current.players[playerIdRef.current]?.avatar,
          existingPlayerId: playerIdRef.current,
        });
      }
    });

    s.on('connect_error', (err) => {
      console.warn('[LODEKS] Socket notice:', err.message);
    });

    s.on('room:update', (updatedRoom: RoomData) => {
      setRoom(updatedRoom);
      setIsConnecting(false);
    });

    s.on('game:timer', ({ timeLeft }: { timeLeft: number }) => {
      setRoundTimeLeft(timeLeft);
      if (timeLeft <= 5 && timeLeft > 0) {
        soundManager.playCountdown();
      }
    });

    s.on('game:round_started', () => {
      soundManager.playBeep(520, 0.2);
    });

    s.on('game:round_ended', () => {
      soundManager.playSuccess();
    });

    s.on('game:answer_result', ({ correct, playerId: responderId }: { correct: boolean; playerId: string }) => {
      if (responderId === playerIdRef.current) {
        if (correct) {
          soundManager.playSuccess();
        } else {
          soundManager.playError();
        }
      }
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const currentPlayer: Player | null = room && playerId ? room.players[playerId] || null : null;

  // Team scores
  const playersList: Player[] = room ? Object.values(room.players) : [];
  const team1Score = playersList.filter((p) => p.team === 1).reduce((acc, p) => acc + p.score, 0);
  const team2Score = playersList.filter((p) => p.team === 2).reduce((acc, p) => acc + p.score, 0);

  // Handlers
  const handleCreateRoom = async (nickname: string, avatar: string) => {
    setIsConnecting(true);
    setErrorMessage('');

    const finishCreation = (pId: string, rData?: RoomData) => {
      setIsConnecting(false);
      setPlayerId(pId);
      if (rData) setRoom(rData);

      if (socket) {
        if (!socket.connected) socket.connect();
        socket.emit('room:join', {
          roomCode: rData ? rData.code : undefined,
          nickname,
          avatar,
          existingPlayerId: pId,
        });
      }
    };

    if (socket && socket.connected) {
      socket.emit(
        'room:create',
        { nickname, avatar },
        (res: { success: boolean; roomCode?: string; playerId?: string; error?: string }) => {
          if (res && res.success && res.playerId) {
            finishCreation(res.playerId);
          } else if (res && res.error) {
            setIsConnecting(false);
            setErrorMessage(res.error);
          }
        }
      );
    }

    // Fast REST fallback
    setTimeout(async () => {
      if (roomRef.current) return;
      try {
        const fetchUrl = '/api/rooms/create';
        const res = await fetch(fetchUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nickname, avatar }),
        });
        const data = await res.json();
        if (data && data.success && data.playerId) {
          finishCreation(data.playerId, data.room);
        } else if (data && data.error) {
          setIsConnecting(false);
          setErrorMessage(data.error);
        }
      } catch (e) {
        console.warn('REST fallback notice:', e);
      }
    }, 1200);
  };

  const handleJoinRoom = async (roomCode: string, nickname: string, avatar: string) => {
    setIsConnecting(true);
    setErrorMessage('');

    const cleanCode = roomCode.toUpperCase().trim();

    const finishJoin = (pId: string, rData?: RoomData) => {
      setIsConnecting(false);
      setPlayerId(pId);
      if (rData) setRoom(rData);

      if (socket) {
        if (!socket.connected) socket.connect();
        socket.emit('room:join', {
          roomCode: cleanCode,
          nickname,
          avatar,
          existingPlayerId: pId,
        });
      }
    };

    if (socket && socket.connected) {
      socket.emit(
        'room:join',
        { roomCode: cleanCode, nickname, avatar, existingPlayerId: playerId || undefined },
        (res: { success: boolean; roomCode?: string; playerId?: string; error?: string }) => {
          if (res && res.success && res.playerId) {
            finishJoin(res.playerId);
          } else if (res && res.error) {
            setIsConnecting(false);
            setErrorMessage(res.error);
          }
        }
      );
    }

    // Fast REST fallback
    setTimeout(async () => {
      if (roomRef.current) return;
      try {
        const fetchUrl = '/api/rooms/join';
        const res = await fetch(fetchUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomCode: cleanCode, nickname, avatar, existingPlayerId: playerId || undefined }),
        });
        const data = await res.json();
        if (data && data.success && data.playerId) {
          finishJoin(data.playerId, data.room);
        } else if (data && data.error) {
          setIsConnecting(false);
          setErrorMessage(data.error);
        }
      } catch (e) {
        console.warn('REST fallback notice:', e);
      }
    }, 1200);
  };

  const handleToggleReady = () => {
    if (!socket || !room || !playerId) return;
    socket.emit('player:ready');
  };

  const handleChangeTeam = (team: 1 | 2) => {
    if (!socket || !room || !playerId) return;
    socket.emit('player:team', { team });
  };

  const handleStartGame = () => {
    if (!socket || !room || !playerId) return;
    socket.emit('game:start');
  };

  const handleNextRound = () => {
    if (!socket || !room || !playerId) return;
    socket.emit('game:next_round');
  };

  const handlePlayAgain = () => {
    if (!socket || !room || !playerId) return;
    socket.emit('game:play_again');
  };

  const handleSendAnswer = (answer: string) => {
    if (!socket || !room || !playerId) return;
    socket.emit('game:answer', { answer });
  };

  const handleDrawStroke = (stroke: DrawingStroke) => {
    if (!socket || !room || !playerId) return;
    socket.emit('draw:stroke', { stroke });
  };

  const handleClearCanvas = () => {
    if (!socket || !room || !playerId) return;
    socket.emit('draw:clear');
  };

  const handleLeaveRoom = () => {
    if (socket && room && playerId) {
      socket.emit('room:leave');
    }
    setRoom(null);
  };

  // Render Mini-Game Active Screen
  const renderActiveMiniGame = () => {
    if (!room || !currentPlayer || !room.roundData) return null;

    switch (room.currentMiniGame) {
      case 'riddles':
        return (
          <RiddlesGame
            roundData={room.roundData}
            currentPlayer={currentPlayer}
            roundTimeLeft={roundTimeLeft}
            onSendAnswer={handleSendAnswer}
          />
        );
      case 'sound_guess':
        return (
          <SoundGuessGame
            roundData={room.roundData}
            currentPlayer={currentPlayer}
            roundTimeLeft={roundTimeLeft}
            onSendAnswer={handleSendAnswer}
          />
        );
      case 'what_happened':
        return (
          <WhatHappenedGame
            roundData={room.roundData}
            currentPlayer={currentPlayer}
            roundTimeLeft={roundTimeLeft}
            onSendAnswer={handleSendAnswer}
          />
        );
      case 'combine_clues':
        return (
          <CombineCluesGame
            roundData={room.roundData}
            currentPlayer={currentPlayer}
            roundTimeLeft={roundTimeLeft}
            onSendAnswer={handleSendAnswer}
          />
        );
      case 'draw_guess':
        return (
          <DrawAndGuessGame
            roundData={room.roundData}
            currentPlayer={currentPlayer}
            roundTimeLeft={roundTimeLeft}
            drawingStrokes={room.drawingStrokes || []}
            chatMessages={room.chatMessages || []}
            onDrawStroke={handleDrawStroke}
            onClearCanvas={handleClearCanvas}
            onSendAnswer={handleSendAnswer}
          />
        );
      case 'who_am_i':
        return (
          <WhoAmIGame
            roundData={room.roundData}
            currentPlayer={currentPlayer}
            roundTimeLeft={roundTimeLeft}
            onSendAnswer={handleSendAnswer}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif]">
      <Header
        roomCode={room?.code}
        currentPlayer={currentPlayer}
        team1Score={team1Score}
        team2Score={team2Score}
        currentRound={room?.currentRound || 0}
        totalRounds={room?.totalRounds || 10}
        onLeaveRoom={room ? handleLeaveRoom : undefined}
      />

      <main className="flex-1 flex flex-col justify-center">
        {!room || !currentPlayer ? (
          <HomeView
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            isConnecting={isConnecting}
            errorMessage={errorMessage}
          />
        ) : room.state === 'lobby' ? (
          <LobbyView
            room={room}
            currentPlayer={currentPlayer}
            onToggleReady={handleToggleReady}
            onChangeTeam={handleChangeTeam}
            onStartGame={handleStartGame}
          />
        ) : room.state === 'round_intro' && room.currentMiniGame ? (
          <RoundIntroView
            miniGame={room.currentMiniGame}
            currentRound={room.currentRound}
            totalRounds={room.totalRounds}
          />
        ) : room.state === 'playing' ? (
          renderActiveMiniGame()
        ) : room.state === 'round_result' ? (
          <RoundResultView
            room={room}
            currentPlayer={currentPlayer}
            onNextRound={handleNextRound}
          />
        ) : room.state === 'final_results' ? (
          <FinalResultsView
            room={room}
            currentPlayer={currentPlayer}
            onPlayAgain={handlePlayAgain}
          />
        ) : null}
      </main>
    </div>
  );
}

export default App;

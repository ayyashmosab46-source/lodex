import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { RoomData, Player, DrawStroke } from './types/game';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { LobbyView } from './components/LobbyView';
import { RoundIntroView } from './components/RoundIntroView';
import { RiddlesGame } from './components/minigames/RiddlesGame';
import { SoundGuessGame } from './components/minigames/SoundGuessGame';
import { WhatHappenedGame } from './components/minigames/WhatHappenedGame';
import { CombineCluesGame } from './components/minigames/CombineCluesGame';
import { DrawAndGuessGame } from './components/minigames/DrawAndGuessGame';
import { WhoAmIGame } from './components/minigames/WhoAmIGame';
import { RoundResultView } from './components/RoundResultView';
import { FinalResultsView } from './components/FinalResultsView';
import { playClickSound, playPopSound, playCaughtAlarm } from './utils/audio';
import { getBackendUrl } from './utils/config';

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Initialize Socket.io client
  useEffect(() => {
    const backendUrl = getBackendUrl();
    console.log('[LODEKS] Connecting to game backend at:', backendUrl || '(same origin)');

    const s = io(backendUrl || undefined, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      timeout: 10000,
      withCredentials: true,
    });

    s.on('connect', () => {
      console.log('[LODEKS] Socket connected successfully:', s.id);
      setErrorMessage('');
    });

    s.on('connect_error', (err) => {
      console.warn('[LODEKS] Socket connection error:', err.message);
    });

    s.on('room:update', (updatedRoom: RoomData) => {
      setRoom(updatedRoom);
      playPopSound();
    });

    s.on('draw:stroke', (stroke: DrawStroke) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          drawingStrokes: [...prev.drawingStrokes, stroke],
        };
      });
    });

    s.on('draw:clear', () => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          drawingStrokes: [],
        };
      });
    });

    s.on('draw:sync', (strokes: DrawStroke[]) => {
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          drawingStrokes: strokes,
        };
      });
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const currentPlayer: Player | null = room && playerId ? room.players[playerId] || null : null;

  // Handle Room Actions
  const handleCreateRoom = (nickname: string, avatar: string) => {
    if (!socket) {
      setErrorMessage('جاري إعداد الاتصال بالخادم، يرجى المحاولة بعد لحظات...');
      return;
    }

    setIsConnecting(true);
    setErrorMessage('');

    if (!socket.connected) {
      socket.connect();
    }

    let resolved = false;
    const timeoutTimer = setTimeout(() => {
      if (!resolved) {
        setIsConnecting(false);
        setErrorMessage('استغرق الاتصال وقتاً طويلاً. تأكد من اتصال الإنترنت ثم أعد المحاولة.');
      }
    }, 8000);

    socket.emit(
      'room:create',
      { nickname, avatar },
      (res: { success: boolean; roomCode?: string; playerId?: string; error?: string }) => {
        resolved = true;
        clearTimeout(timeoutTimer);
        setIsConnecting(false);
        if (res && res.success && res.playerId) {
          setPlayerId(res.playerId);
        } else if (res && res.error) {
          setErrorMessage(res.error);
        } else {
          setErrorMessage('تعذر إنشاء الغرفة. يرجى المحاولة مرة أخرى.');
        }
      }
    );
  };

  const handleJoinRoom = (roomCode: string, nickname: string, avatar: string) => {
    if (!socket) {
      setErrorMessage('جاري إعداد الاتصال بالخادم، يرجى المحاولة بعد لحظات...');
      return;
    }

    setIsConnecting(true);
    setErrorMessage('');

    if (!socket.connected) {
      socket.connect();
    }

    let resolved = false;
    const timeoutTimer = setTimeout(() => {
      if (!resolved) {
        setIsConnecting(false);
        setErrorMessage('استغرق الاتصال وقتاً طويلاً. تأكد من صحة رمز الغرفة واتصالك بالإنترنت.');
      }
    }, 8000);

    socket.emit(
      'room:join',
      { roomCode, nickname, avatar, existingPlayerId: playerId || undefined },
      (res: { success: boolean; roomCode?: string; playerId?: string; error?: string }) => {
        resolved = true;
        clearTimeout(timeoutTimer);
        setIsConnecting(false);
        if (res && res.success && res.playerId) {
          setPlayerId(res.playerId);
        } else if (res && res.error) {
          setErrorMessage(res.error);
        } else {
          setErrorMessage('تعذر الدخول إلى الغرفة.');
        }
      }
    );
  };

  const handleToggleReady = () => {
    if (!socket) return;
    socket.emit('player:ready');
  };

  const handleSwitchTeam = () => {
    if (!socket) return;
    socket.emit('player:switch_team');
  };

  const handleStartGame = () => {
    if (!socket) return;
    socket.emit('game:start');
  };

  const handleSoundAnswer = (optionIndex: number) => {
    if (!socket) return;
    socket.emit('game:sound_answer', { optionIndex });
  };

  const handleWhatHappenedAnswer = (optionIndex: number) => {
    if (!socket) return;
    socket.emit('game:what_happened_answer', { optionIndex });
  };

  const handleWhoAmIAnswer = (optionIndex: number) => {
    if (!socket) return;
    socket.emit('game:who_am_i_answer', { optionIndex });
  };

  const handleSubmitGuess = (text: string) => {
    if (!socket) return;
    socket.emit('game:submit_guess', { text });
  };

  const handleSendStroke = (stroke: DrawStroke) => {
    if (!socket) return;
    socket.emit('draw:stroke', stroke);
  };

  const handleClearCanvas = () => {
    if (!socket) return;
    socket.emit('draw:clear');
  };

  const handleUndoStroke = () => {
    if (!socket) return;
    socket.emit('draw:undo');
  };

  const handlePlayAgain = () => {
    if (!socket) return;
    socket.emit('game:play_again');
  };

  const handleLeaveRoom = () => {
    if (socket) {
      socket.disconnect();
      socket.connect();
    }
    setRoom(null);
    setPlayerId(null);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-amber-500 selection:text-slate-950 font-['Readex_Pro']">
      <Header
        room={room}
        currentPlayer={currentPlayer}
        onLeaveRoom={handleLeaveRoom}
      />

      <main className="flex-1 flex flex-col justify-center items-center w-full">
        {/* VIEW 1: HOME (No room) */}
        {!room && (
          <HomeView
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            errorMessage={errorMessage}
            isConnecting={isConnecting}
          />
        )}

        {/* VIEW 2: LOBBY */}
        {room && room.state === 'lobby' && currentPlayer && (
          <LobbyView
            room={room}
            currentPlayer={currentPlayer}
            onToggleReady={handleToggleReady}
            onSwitchTeam={handleSwitchTeam}
            onStartGame={handleStartGame}
          />
        )}

        {/* VIEW 3: ROUND INTRO */}
        {room && room.state === 'round_intro' && currentPlayer && (
          <RoundIntroView
            room={room}
            currentPlayer={currentPlayer}
          />
        )}

        {/* VIEW 4: ACTIVE MINI-GAME */}
        {room && room.state === 'in_round' && currentPlayer && (
          <>
            {room.currentMiniGame === 'riddles' && (
              <RiddlesGame
                room={room}
                currentPlayer={currentPlayer}
                onSubmitGuess={handleSubmitGuess}
              />
            )}

            {room.currentMiniGame === 'sound_guess' && (
              <SoundGuessGame
                room={room}
                currentPlayer={currentPlayer}
                onAnswer={handleSoundAnswer}
              />
            )}

            {room.currentMiniGame === 'what_happened' && (
              <WhatHappenedGame
                room={room}
                currentPlayer={currentPlayer}
                onAnswer={handleWhatHappenedAnswer}
              />
            )}

            {room.currentMiniGame === 'combine_clues' && (
              <CombineCluesGame
                room={room}
                currentPlayer={currentPlayer}
                onSubmitGuess={handleSubmitGuess}
              />
            )}

            {room.currentMiniGame === 'draw_guess' && (
              <DrawAndGuessGame
                room={room}
                currentPlayer={currentPlayer}
                onSendStroke={handleSendStroke}
                onClearCanvas={handleClearCanvas}
                onUndoStroke={handleUndoStroke}
                onSubmitGuess={handleSubmitGuess}
              />
            )}

            {room.currentMiniGame === 'who_am_i' && (
              <WhoAmIGame
                room={room}
                currentPlayer={currentPlayer}
                onAnswer={handleWhoAmIAnswer}
              />
            )}
          </>
        )}

        {/* VIEW 5: ROUND RESULT */}
        {room && room.state === 'round_result' && currentPlayer && (
          <RoundResultView
            room={room}
            currentPlayer={currentPlayer}
          />
        )}

        {/* VIEW 6: FINAL MATCH END PODIUM */}
        {room && room.state === 'match_end' && currentPlayer && (
          <FinalResultsView
            room={room}
            currentPlayer={currentPlayer}
            onPlayAgain={handlePlayAgain}
            onLeave={handleLeaveRoom}
          />
        )}
      </main>
    </div>
  );
}

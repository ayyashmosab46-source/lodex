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

  const roomRef = useRef<RoomData | null>(null);
  const playerIdRef = useRef<string | null>(null);
  roomRef.current = room;
  playerIdRef.current = playerId;

  // Initialize Socket.io client
  useEffect(() => {
    const backendUrl = getBackendUrl();
    console.log('[LODEKS] Connecting to game backend at:', backendUrl || '(same origin)');

    const s = io(backendUrl || undefined, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 30,
      reconnectionDelay: 1000,
      timeout: 15000,
      withCredentials: true,
    });

    s.on('connect', () => {
      console.log('[LODEKS] Socket connected successfully:', s.id);
      setErrorMessage('');
      // If we have an active room and playerId, ensure socket joins the room channel
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
      console.warn('[LODEKS] Socket connection notice:', err.message);
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

  // Handle Room Actions (with instant REST fallback)
  const handleCreateRoom = async (nickname: string, avatar: string) => {
    setIsConnecting(true);
    setErrorMessage('');

    const backendUrl = getBackendUrl();
    let resolved = false;

    // Helper to finish room creation
    const finishCreation = (pId: string, rData?: RoomData) => {
      if (resolved) return;
      resolved = true;
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

    // 1. Try Socket.io if connected
    if (socket && socket.connected) {
      socket.emit(
        'room:create',
        { nickname, avatar },
        (res: { success: boolean; roomCode?: string; playerId?: string; error?: string }) => {
          if (res && res.success && res.playerId) {
            finishCreation(res.playerId);
          } else if (res && res.error) {
            resolved = true;
            setIsConnecting(false);
            setErrorMessage(res.error);
          }
        }
      );
    }

    // 2. Immediate REST Fallback / Parallel Fast Track
    const restTimer = setTimeout(async () => {
      if (resolved) return;
      try {
        const fetchUrl = backendUrl ? `${backendUrl}/api/rooms/create` : '/api/rooms/create';
        const res = await fetch(fetchUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nickname, avatar }),
        });
        const data = await res.json();
        if (data && data.success && data.playerId) {
          finishCreation(data.playerId, data.room);
        } else if (data && data.error) {
          resolved = true;
          setIsConnecting(false);
          setErrorMessage(data.error);
        }
      } catch (err) {
        console.warn('REST create room fallback failed:', err);
      }
    }, 1500);

    // 3. Timeout safeguard
    setTimeout(() => {
      if (!resolved) {
        clearTimeout(restTimer);
        setIsConnecting(false);
        setErrorMessage('استغرق الاتصال وقتاً أطول من المتوقع. تأكد من اتصال الإنترنت ثم أعد المحاولة.');
      }
    }, 10000);
  };

  const handleJoinRoom = async (roomCode: string, nickname: string, avatar: string) => {
    setIsConnecting(true);
    setErrorMessage('');

    const backendUrl = getBackendUrl();
    const cleanCode = roomCode.toUpperCase().trim();
    let resolved = false;

    const finishJoin = (pId: string, rData?: RoomData) => {
      if (resolved) return;
      resolved = true;
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

    // 1. Try Socket.io if connected
    if (socket && socket.connected) {
      socket.emit(
        'room:join',
        { roomCode: cleanCode, nickname, avatar, existingPlayerId: playerId || undefined },
        (res: { success: boolean; roomCode?: string; playerId?: string; error?: string }) => {
          if (res && res.success && res.playerId) {
            finishJoin(res.playerId);
          } else if (res && res.error) {
            resolved = true;
            setIsConnecting(false);
            setErrorMessage(res.error);
          }
        }
      );
    }

    // 2. Fast REST fallback
    const restTimer = setTimeout(async () => {
      if (resolved) return;
      try {
        const fetchUrl = backendUrl ? `${backendUrl}/api/rooms/join` : '/api/rooms/join';
        const res = await fetch(fetchUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode: cleanCode,
            nickname,
            avatar,
            existingPlayerId: playerId || undefined,
          }),
        });
        const data = await res.json();
        if (data && data.success && data.playerId) {
          finishJoin(data.playerId, data.room);
        } else if (data && data.error) {
          resolved = true;
          setIsConnecting(false);
          setErrorMessage(data.error);
        }
      } catch (err) {
        console.warn('REST join room fallback error:', err);
      }
    }, 1500);

    // 3. Timeout safeguard
    setTimeout(() => {
      if (!resolved) {
        clearTimeout(restTimer);
        setIsConnecting(false);
        setErrorMessage('تعذر العثور على الغرفة أو استغرق الاتصال وقتاً طويلاً. تأكد من صحة الرمز.');
      }
    }, 10000);
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

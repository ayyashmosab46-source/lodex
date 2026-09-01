import React, { useState, useEffect, useRef } from 'react';
import { RoomData, Player, DrawingStroke } from './types/game';
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
import { realtimeClient } from './utils/realtimeClient';
import { soundManager } from './utils/audio';

export function App() {
  const [room, setRoom] = useState<RoomData | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(() => {
    return localStorage.getItem('lodeks_player_id') || null;
  });
  const [roundTimeLeft, setRoundTimeLeft] = useState<number>(30);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const playerIdRef = useRef<string | null>(null);
  playerIdRef.current = playerId;

  // Persist playerId
  useEffect(() => {
    if (playerId) {
      localStorage.setItem('lodeks_player_id', playerId);
    }
  }, [playerId]);

  // Subscribe to real-time events
  useEffect(() => {
    const onRoomUpdate = (updatedRoom: RoomData) => {
      setRoom(updatedRoom);
      setIsConnecting(false);
      setErrorMessage('');
    };

    const onTimer = ({ timeLeft }: { timeLeft: number }) => {
      setRoundTimeLeft(timeLeft);
      if (timeLeft <= 5 && timeLeft > 0) {
        soundManager.playCountdown();
      }
    };

    const onRoundStarted = () => {
      soundManager.playBeep(520, 0.2);
    };

    const onRoundEnded = () => {
      soundManager.playSuccess();
    };

    const onAnswerResult = ({ correct, playerId: responderId }: { correct: boolean; playerId: string }) => {
      if (responderId === playerIdRef.current) {
        if (correct) {
          soundManager.playSuccess();
        } else {
          soundManager.playError();
        }
      }
    };

    realtimeClient.on('room:update', onRoomUpdate);
    realtimeClient.on('game:timer', onTimer);
    realtimeClient.on('game:round_started', onRoundStarted);
    realtimeClient.on('game:round_ended', onRoundEnded);
    realtimeClient.on('game:answer_result', onAnswerResult);

    return () => {
      realtimeClient.off('room:update', onRoomUpdate);
      realtimeClient.off('game:timer', onTimer);
      realtimeClient.off('game:round_started', onRoundStarted);
      realtimeClient.off('game:round_ended', onRoundEnded);
      realtimeClient.off('game:answer_result', onAnswerResult);
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

    try {
      const res = await realtimeClient.createRoom(nickname, avatar);
      setIsConnecting(false);
      if (res.success && res.playerId && res.room) {
        setPlayerId(res.playerId);
        setRoom(res.room);
      } else {
        setErrorMessage(res.error || 'تعذر إنشاء الغرفة. يرجى المحاولة مرة أخرى.');
      }
    } catch (err: any) {
      setIsConnecting(false);
      setErrorMessage(err?.message || 'حدث خطأ أثناء إنشاء الغرفة.');
    }
  };

  const handleJoinRoom = async (roomCode: string, nickname: string, avatar: string) => {
    setIsConnecting(true);
    setErrorMessage('');

    try {
      const res = await realtimeClient.joinRoom(roomCode, nickname, avatar, playerId || undefined);
      setIsConnecting(false);
      if (res.success && res.playerId && res.room) {
        setPlayerId(res.playerId);
        setRoom(res.room);
      } else {
        setErrorMessage(res.error || 'تعذر الانضمام للغرفة. تأكد من رمز الغرفة.');
      }
    } catch (err: any) {
      setIsConnecting(false);
      setErrorMessage(err?.message || 'حدث خطأ أثناء الانضمام للغرفة.');
    }
  };

  const handleToggleReady = () => {
    realtimeClient.toggleReady();
  };

  const handleChangeTeam = (team: 1 | 2) => {
    realtimeClient.changeTeam(team);
  };

  const handleStartGame = () => {
    realtimeClient.startGame();
  };

  const handleNextRound = () => {
    realtimeClient.nextRound();
  };

  const handlePlayAgain = () => {
    realtimeClient.playAgain();
  };

  const handleSendAnswer = (answer: string) => {
    realtimeClient.sendAnswer(answer);
  };

  const handleDrawStroke = (stroke: DrawingStroke) => {
    realtimeClient.sendStroke(stroke);
  };

  const handleClearCanvas = () => {
    realtimeClient.clearCanvas();
  };

  const handleLeaveRoom = () => {
    realtimeClient.leaveRoom();
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

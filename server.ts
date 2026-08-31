import express from 'express';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer, Socket } from 'socket.io';
import {
  MiniGameType,
  RoomData,
  Player,
  DrawStroke,
  ChatMessage,
  MINI_GAME_INFO,
} from './src/types/game';
import {
  RIDDLES_POOL,
  SOUND_QUESTIONS_POOL,
  WHAT_HAPPENED_POOL,
  WHO_AM_I_POOL,
  CLUE_QUESTIONS_POOL,
  DRAW_WORDS_POOL,
} from './src/data/content';
import { checkArabicMatch } from './src/utils/arabic';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

const PORT = Number(process.env.PORT) || 3000;

// In-memory rooms storage
const rooms: Record<string, RoomData> = {};
const socketToPlayerMap: Record<string, { roomCode: string; playerId: string }> = {};

// Helper to generate 4-character uppercase room codes
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rooms[code]);
  return code;
}

// Avatars pool
const AVATARS = ['🦁', '🦅', '🐪', '🚀', '👑', '⚡', '🍕', '🎮', '🏎️', '💎', '🔥', '🌟'];

function getRandomAvatar(): string {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

const MINI_GAMES: MiniGameType[] = [
  'sound_guess',
  'what_happened',
  'combine_clues',
  'draw_guess',
  'who_am_i',
  'riddles',
];

/**
 * Picks the next mini-game with strict balancing and diversity:
 * 1. Never repeats the same game in two consecutive rounds.
 * 2. Prioritizes mini-games that have been played the least number of times in the match history.
 * 3. Guarantees all 6 games appear in the first 6 rounds, and are evenly balanced across 10 rounds.
 * 4. Ensures all games are distributed fairly and not tied to fixed slots.
 */
function pickNextMiniGame(history: MiniGameType[]): MiniGameType {
  const lastGame = history.length > 0 ? history[history.length - 1] : null;

  // Count frequency of each mini-game in history
  const frequencyMap: Record<MiniGameType, number> = {
    sound_guess: 0,
    what_happened: 0,
    combine_clues: 0,
    draw_guess: 0,
    who_am_i: 0,
    riddles: 0,
  };

  for (const g of history) {
    if (frequencyMap[g] !== undefined) {
      frequencyMap[g] += 1;
    }
  }

  // Filter out the last played game (no consecutive repeats)
  const availableGames = MINI_GAMES.filter((g) => g !== lastGame);

  // Find minimum played count among the available candidates
  const minPlayedCount = Math.min(...availableGames.map((g) => frequencyMap[g]));

  // Select candidates that have been played the fewest times
  const leastPlayedCandidates = availableGames.filter((g) => frequencyMap[g] === minPlayedCount);

  // Pick randomly from the least played candidates to maintain variety
  const selectedGame = leastPlayedCandidates[Math.floor(Math.random() * leastPlayedCandidates.length)];
  return selectedGame;
}

// Timers map for room transitions & ticks
const roomTimers: Record<string, NodeJS.Timeout> = {};
const roomIntervals: Record<string, NodeJS.Timeout> = {};

function clearRoomTimer(roomCode: string) {
  if (roomTimers[roomCode]) {
    clearTimeout(roomTimers[roomCode]);
    delete roomTimers[roomCode];
  }
}

function clearRoomInterval(roomCode: string) {
  if (roomIntervals[roomCode]) {
    clearInterval(roomIntervals[roomCode]);
    delete roomIntervals[roomCode];
  }
}

// Broadcast room state helper
function broadcastRoom(roomCode: string) {
  const room = rooms[roomCode];
  if (!room) return;
  io.to(roomCode).emit('room:update', room);
}

// Prepare next round
function startNextRound(roomCode: string) {
  const room = rooms[roomCode];
  if (!room) return;
  clearRoomTimer(roomCode);
  clearRoomInterval(roomCode);

  if (room.currentRound >= room.totalRounds) {
    // Match End!
    room.state = 'match_end';
    broadcastRoom(roomCode);
    return;
  }

  room.currentRound += 1;
  const miniGame = pickNextMiniGame(room.gameHistory);
  room.gameHistory.push(miniGame);
  room.currentMiniGame = miniGame;
  room.state = 'round_intro';
  room.drawingStrokes = [];
  room.chatMessages = [];
  room.lastRoundResults = null;

  // Reset per-round player flags
  Object.values(room.players).forEach((p) => {
    p.roundScore = 0;
    p.hasAnswered = false;
    p.tappedAt = undefined;
    p.answerTime = undefined;
    p.role = 'player';
  });

  const connectedPlayers = Object.values(room.players).filter((p) => p.isConnected);
  const info = MINI_GAME_INFO[miniGame];

  // Configure round data
  if (miniGame === 'riddles') {
    const question = RIDDLES_POOL[Math.floor(Math.random() * RIDDLES_POOL.length)];
    room.roundData = {
      title: info.nameAr,
      description: info.descAr,
      riddleQuestion: question,
      activeTeam: 1,
      team1TimeLeft: 30,
      team2TimeLeft: 30,
      turnStartTime: 0,
    };
  } else if (miniGame === 'sound_guess') {
    const question = SOUND_QUESTIONS_POOL[Math.floor(Math.random() * SOUND_QUESTIONS_POOL.length)];
    room.roundData = {
      title: info.nameAr,
      description: info.descAr,
      soundQuestion: question,
    };
  } else if (miniGame === 'what_happened') {
    const question = WHAT_HAPPENED_POOL[Math.floor(Math.random() * WHAT_HAPPENED_POOL.length)];
    room.roundData = {
      title: info.nameAr,
      description: info.descAr,
      whatHappenedQuestion: question,
      playerAnswers: {},
    };
  } else if (miniGame === 'combine_clues') {
    const question = CLUE_QUESTIONS_POOL[Math.floor(Math.random() * CLUE_QUESTIONS_POOL.length)];
    room.roundData = {
      title: info.nameAr,
      description: info.descAr,
      clueQuestion: question,
    };
  } else if (miniGame === 'draw_guess') {
    // 2-Team Draw & Guess Setup
    const team1Players = connectedPlayers.filter((p) => p.team === 1);
    const team2Players = connectedPlayers.filter((p) => p.team === 2);

    const team1Artist = team1Players.length > 0
      ? team1Players[Math.floor(Math.random() * team1Players.length)]
      : connectedPlayers[0];

    const team2Artist = team2Players.length > 0
      ? team2Players[Math.floor(Math.random() * team2Players.length)]
      : (connectedPlayers[1] || connectedPlayers[0]);

    const word = DRAW_WORDS_POOL[Math.floor(Math.random() * DRAW_WORDS_POOL.length)];

    if (team1Artist) {
      team1Artist.role = 'artist';
    }

    room.roundData = {
      title: info.nameAr,
      description: info.descAr,
      activeTeam: 1,
      activePlayerId: team1Artist ? team1Artist.id : undefined,
      team1ArtistId: team1Artist ? team1Artist.id : undefined,
      team2ArtistId: team2Artist ? team2Artist.id : undefined,
      drawWord: word,
      team1AttemptUsed: false,
      team2AttemptUsed: false,
    };
  } else if (miniGame === 'who_am_i') {
    const question = WHO_AM_I_POOL[Math.floor(Math.random() * WHO_AM_I_POOL.length)];
    room.roundData = {
      title: info.nameAr,
      description: info.descAr,
      whoAmIQuestion: question,
      revealedHintsCount: 1,
      playerAnswers: {},
    };
  }

  broadcastRoom(roomCode);

  // 3.5 seconds round intro countdown then launch active round
  roomTimers[roomCode] = setTimeout(() => {
    launchActiveRound(roomCode);
  }, 3500);
}

function launchActiveRound(roomCode: string) {
  const room = rooms[roomCode];
  if (!room) return;
  clearRoomTimer(roomCode);
  clearRoomInterval(roomCode);

  room.state = 'in_round';
  const duration = MINI_GAME_INFO[room.currentMiniGame!].duration;
  room.roundDuration = duration;
  room.roundStartTime = Date.now();
  room.roundEndTime = Date.now() + duration * 1000;

  // Progressive Hint Unlocking for "Who Am I?" (مين أنا؟)
  if (room.currentMiniGame === 'who_am_i' && room.roundData) {
    room.roundData.revealedHintsCount = 1;

    roomIntervals[roomCode] = setInterval(() => {
      const curRoom = rooms[roomCode];
      if (!curRoom || curRoom.state !== 'in_round' || curRoom.currentMiniGame !== 'who_am_i' || !curRoom.roundData) {
        clearRoomInterval(roomCode);
        return;
      }

      const elapsed = (Date.now() - curRoom.roundStartTime) / 1000;
      let newCount = 1;
      if (elapsed >= 16) {
        newCount = 3; // Hint 3 unlocked (50 pts)
      } else if (elapsed >= 8) {
        newCount = 2; // Hint 2 unlocked (75 pts)
      } else {
        newCount = 1; // Hint 1 active (100 pts)
      }

      if (newCount !== curRoom.roundData.revealedHintsCount) {
        curRoom.roundData.revealedHintsCount = newCount;
        broadcastRoom(roomCode);
      }
    }, 500);
  }

  if (room.currentMiniGame === 'riddles' && room.roundData) {
    room.roundData.turnStartTime = Date.now();
    room.roundData.team1TimeLeft = 30;
    room.roundData.team2TimeLeft = 30;
    room.roundData.activeTeam = 1;

    // Team Turn Ticker Interval (30s per team, 60s total)
    roomIntervals[roomCode] = setInterval(() => {
      const currentRoom = rooms[roomCode];
      if (!currentRoom || currentRoom.state !== 'in_round' || !currentRoom.roundData) {
        clearRoomInterval(roomCode);
        return;
      }

      const rd = currentRoom.roundData;
      if (rd.activeTeam === 1) {
        rd.team1TimeLeft = Math.max(0, (rd.team1TimeLeft ?? 30) - 1);
        if (rd.team1TimeLeft <= 0) {
          if ((rd.team2TimeLeft ?? 30) > 0) {
            rd.activeTeam = 2;
            rd.turnStartTime = Date.now();
            currentRoom.chatMessages.push({
              id: `sys_${Date.now()}`,
              playerId: 'system',
              nickname: 'نظام لودكس',
              text: '⌛ انتهى وقت الفريق الأول! الآن دور الفريق الثاني 🔵',
              isSystem: true,
              timestamp: Date.now(),
            });
            broadcastRoom(roomCode);
          } else {
            clearRoomInterval(roomCode);
            finishRound(
              roomCode,
              `انتهى وقت الفريقين! الإجابة الصحيحة كانت: ${rd.riddleQuestion?.acceptedAnswers[0] || ''}`,
              undefined,
              rd.riddleQuestion?.acceptedAnswers[0]
            );
            return;
          }
        }
      } else if (rd.activeTeam === 2) {
        rd.team2TimeLeft = Math.max(0, (rd.team2TimeLeft ?? 30) - 1);
        if (rd.team2TimeLeft <= 0) {
          if ((rd.team1TimeLeft ?? 30) > 0) {
            rd.activeTeam = 1;
            rd.turnStartTime = Date.now();
            currentRoom.chatMessages.push({
              id: `sys_${Date.now()}`,
              playerId: 'system',
              nickname: 'نظام لودكس',
              text: '⌛ انتهى وقت الفريق الثاني! الآن دور الفريق الأول 🔴',
              isSystem: true,
              timestamp: Date.now(),
            });
            broadcastRoom(roomCode);
          } else {
            clearRoomInterval(roomCode);
            finishRound(
              roomCode,
              `انتهى وقت الفريقين! الإجابة الصحيحة كانت: ${rd.riddleQuestion?.acceptedAnswers[0] || ''}`,
              undefined,
              rd.riddleQuestion?.acceptedAnswers[0]
            );
            return;
          }
        }
      }

      broadcastRoom(roomCode);
    }, 1000);
  }

  broadcastRoom(roomCode);

  // Set timeout to auto end round if not completed early
  roomTimers[roomCode] = setTimeout(() => {
    finishRound(roomCode, 'انتهى الوقت!');
  }, duration * 1000);
}

function finishRound(roomCode: string, summary: string, winnerId?: string, correctAnswer?: string) {
  const room = rooms[roomCode];
  if (!room || room.state === 'round_result' || room.state === 'match_end') return;
  clearRoomTimer(roomCode);
  clearRoomInterval(roomCode);

  room.state = 'round_result';

  const scoresEarned: Record<string, number> = {};
  Object.values(room.players).forEach((p) => {
    scoresEarned[p.id] = p.roundScore;
    p.score += p.roundScore;
  });

  room.lastRoundResults = {
    miniGame: room.currentMiniGame!,
    scoresEarned,
    summaryText: summary,
    winnerId,
    winningTeam: room.roundData?.winningTeam,
    correctAnswer: correctAnswer || (
      room.roundData?.riddleQuestion?.acceptedAnswers[0] ||
      (room.roundData?.whatHappenedQuestion ? room.roundData.whatHappenedQuestion.options[room.roundData.whatHappenedQuestion.correctAnswer] : undefined) ||
      (room.roundData?.whoAmIQuestion ? room.roundData.whoAmIQuestion.options[room.roundData.whoAmIQuestion.correctAnswer] : undefined) ||
      room.roundData?.clueQuestion?.acceptedAnswers[0] ||
      room.roundData?.drawWord ||
      (room.roundData?.soundQuestion ? room.roundData.soundQuestion.options[room.roundData.soundQuestion.correctIndex] : undefined)
    ),
  };

  broadcastRoom(roomCode);

  // Auto transition to next round after 5 seconds
  roomTimers[roomCode] = setTimeout(() => {
    startNextRound(roomCode);
  }, 5000);
}

// Socket IO Handlers
io.on('connection', (socket: Socket) => {
  // CREATE ROOM
  socket.on('room:create', ({ nickname, avatar }: { nickname: string; avatar?: string }, callback) => {
    const cleanNick = (nickname || 'لاعب').trim().slice(0, 15);
    const roomCode = generateRoomCode();
    const playerId = socket.id;

    const hostPlayer: Player = {
      id: playerId,
      socketId: socket.id,
      nickname: cleanNick,
      avatar: avatar || getRandomAvatar(),
      score: 0,
      roundScore: 0,
      isHost: true,
      isConnected: true,
      isReady: true,
      team: 1, // Host starts on Team 1
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
    socketToPlayerMap[socket.id] = { roomCode, playerId };

    socket.join(roomCode);
    if (callback) callback({ success: true, roomCode, playerId });
    broadcastRoom(roomCode);
  });

  // JOIN ROOM
  socket.on('room:join', ({ roomCode, nickname, avatar, existingPlayerId }: { roomCode: string; nickname: string; avatar?: string; existingPlayerId?: string }, callback) => {
    const code = (roomCode || '').toUpperCase().trim();
    const room = rooms[code];

    if (!room) {
      if (callback) callback({ success: false, error: 'الغرفة غير موجودة! تأكد من الرمز.' });
      return;
    }

    const currentPlayers = Object.values(room.players);

    // Reconnection check
    if (existingPlayerId && room.players[existingPlayerId]) {
      const p = room.players[existingPlayerId];
      p.socketId = socket.id;
      p.isConnected = true;
      socketToPlayerMap[socket.id] = { roomCode: code, playerId: existingPlayerId };
      socket.join(code);
      if (callback) callback({ success: true, roomCode: code, playerId: existingPlayerId });
      broadcastRoom(code);
      return;
    }

    if (currentPlayers.length >= 8) {
      if (callback) callback({ success: false, error: 'الغرفة ممتلئة! الحد الأقصى 8 لاعبين.' });
      return;
    }

    if (room.state !== 'lobby') {
      if (callback) callback({ success: false, error: 'المباراة قد بدأت بالفعل!' });
      return;
    }

    const cleanNick = (nickname || `لاعب ${currentPlayers.length + 1}`).trim().slice(0, 15);
    const playerId = socket.id;

    // Balance teams automatically
    const team1Count = currentPlayers.filter((p) => p.team === 1).length;
    const team2Count = currentPlayers.filter((p) => p.team === 2).length;
    const assignedTeam: 1 | 2 = team1Count <= team2Count ? 1 : 2;

    const newPlayer: Player = {
      id: playerId,
      socketId: socket.id,
      nickname: cleanNick,
      avatar: avatar || getRandomAvatar(),
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
    socketToPlayerMap[socket.id] = { roomCode: code, playerId };

    socket.join(code);
    if (callback) callback({ success: true, roomCode: code, playerId });
    broadcastRoom(code);
  });

  // SWITCH TEAM (Lobby)
  socket.on('player:switch_team', () => {
    const mapping = socketToPlayerMap[socket.id];
    if (!mapping) return;
    const room = rooms[mapping.roomCode];
    if (!room || room.state !== 'lobby') return;

    const player = room.players[mapping.playerId];
    if (!player) return;

    player.team = player.team === 1 ? 2 : 1;
    broadcastRoom(mapping.roomCode);
  });

  // READY TOGGLE
  socket.on('player:ready', () => {
    const mapping = socketToPlayerMap[socket.id];
    if (!mapping) return;
    const room = rooms[mapping.roomCode];
    if (!room || !room.players[mapping.playerId]) return;

    const player = room.players[mapping.playerId];
    player.isReady = !player.isReady;
    broadcastRoom(mapping.roomCode);
  });

  // START MATCH (Host only)
  socket.on('game:start', () => {
    const mapping = socketToPlayerMap[socket.id];
    if (!mapping) return;
    const room = rooms[mapping.roomCode];
    if (!room) return;

    const player = room.players[mapping.playerId];
    if (!player || !player.isHost) return;

    const connectedCount = Object.values(room.players).filter((p) => p.isConnected).length;
    // Minimum 1 player in dev/test, standard is 3+
    if (connectedCount < 1) return;

    room.currentRound = 0;
    room.gameHistory = [];
    Object.values(room.players).forEach((p) => {
      p.score = 0;
      p.correctGuessesCount = 0;
      p.riddleWins = 0;
      p.drawingsWon = 0;
      p.penalties = 0;
    });

    startNextRound(mapping.roomCode);
  });

  // MINI-GAME 2: SOUND GUESS
  socket.on('game:sound_answer', ({ optionIndex }: { optionIndex: number }) => {
    const mapping = socketToPlayerMap[socket.id];
    if (!mapping) return;
    const room = rooms[mapping.roomCode];
    if (!room || room.state !== 'in_round' || room.currentMiniGame !== 'sound_guess') return;

    const player = room.players[mapping.playerId];
    if (!player || player.hasAnswered) return;

    player.hasAnswered = true;
    const q = room.roundData?.soundQuestion;
    if (!q) return;

    if (optionIndex === q.correctIndex) {
      const remainingRatio = Math.max(0, (room.roundEndTime - Date.now()) / (room.roundDuration * 1000));
      const points = 50 + Math.round(remainingRatio * 50);
      player.roundScore = points;
      player.correctGuessesCount += 1;
      socket.emit('game:answer_result', { correct: true, points });
    } else {
      player.roundScore = 0;
      socket.emit('game:answer_result', { correct: false, points: 0 });
    }

    broadcastRoom(mapping.roomCode);

    // If all answered, finish early
    const connected = Object.values(room.players).filter((p) => p.isConnected);
    if (connected.every((p) => p.hasAnswered)) {
      const best = connected.sort((a, b) => b.roundScore - a.roundScore)[0];
      finishRound(mapping.roomCode, `الإجابة الصحيحة هي: ${q.options[q.correctIndex]}`, best?.roundScore > 0 ? best.id : undefined);
    }
  });

  // MINI-GAME: WHAT HAPPENED? ("وش صار؟")
  socket.on('game:what_happened_answer', ({ optionIndex }: { optionIndex: number }) => {
    const mapping = socketToPlayerMap[socket.id];
    if (!mapping) return;
    const room = rooms[mapping.roomCode];
    if (!room || room.state !== 'in_round' || room.currentMiniGame !== 'what_happened' || !room.roundData) return;

    const player = room.players[mapping.playerId];
    if (!player || player.hasAnswered) return;

    const q = room.roundData.whatHappenedQuestion;
    if (!q) return;

    player.hasAnswered = true;
    const isCorrect = optionIndex === q.correctAnswer;
    let points = 0;

    if (isCorrect) {
      player.correctGuessesCount += 1;
      const timeRemaining = Math.max(0, room.roundEndTime - Date.now());
      const totalDuration = room.roundDuration * 1000;
      const speedRatio = Math.min(1, Math.max(0, timeRemaining / totalDuration));
      points = 60 + Math.round(speedRatio * 40); // 60-100 pts based on speed
      player.roundScore = points;
      socket.emit('game:answer_result', { correct: true, points });
    } else {
      player.roundScore = 0;
      socket.emit('game:answer_result', { correct: false, points: 0 });
    }

    if (!room.roundData.playerAnswers) {
      room.roundData.playerAnswers = {};
    }
    room.roundData.playerAnswers[player.id] = {
      answerIndex: optionIndex,
      isCorrect,
      timeMs: Date.now() - room.roundStartTime,
      points,
    };

    broadcastRoom(mapping.roomCode);

    // If all connected players have answered, finish round immediately
    const connected = Object.values(room.players).filter((p) => p.isConnected);
    if (connected.length > 0 && connected.every((p) => p.hasAnswered)) {
      const correctPlayers = connected.filter((p) => p.roundScore > 0).sort((a, b) => b.roundScore - a.roundScore);
      const winner = correctPlayers[0];
      const correctOptionText = q.options[q.correctAnswer];
      const summary = winner
        ? `🎬 أسرع إجابة صحيحة كانت من ${winner.nickname}! (+${winner.roundScore} نقطة)`
        : `انتهت جولة وش صار! الإجابة الصحيحة هي: ${correctOptionText}`;
      finishRound(mapping.roomCode, summary, winner?.id, correctOptionText);
    }
  });

  // MINI-GAME: WHO AM I? ("مين أنا؟")
  socket.on('game:who_am_i_answer', ({ optionIndex }: { optionIndex: number }) => {
    const mapping = socketToPlayerMap[socket.id];
    if (!mapping) return;
    const room = rooms[mapping.roomCode];
    if (!room || room.state !== 'in_round' || room.currentMiniGame !== 'who_am_i' || !room.roundData) return;

    const player = room.players[mapping.playerId];
    if (!player || player.hasAnswered) return;

    const q = room.roundData.whoAmIQuestion;
    if (!q) return;

    player.hasAnswered = true;
    const isCorrect = optionIndex === q.correctAnswer;
    let points = 0;

    if (isCorrect) {
      player.correctGuessesCount += 1;
      const hintsRevealed = room.roundData.revealedHintsCount || 1;
      if (hintsRevealed === 1) {
        points = 100; // Hint 1: 100 pts
      } else if (hintsRevealed === 2) {
        points = 75; // Hint 2: 75 pts
      } else {
        points = 50; // Hint 3: 50 pts
      }
      player.roundScore = points;
      socket.emit('game:answer_result', { correct: true, points });
    } else {
      player.roundScore = 0;
      socket.emit('game:answer_result', { correct: false, points: 0 });
    }

    if (!room.roundData.playerAnswers) {
      room.roundData.playerAnswers = {};
    }
    room.roundData.playerAnswers[player.id] = {
      answerIndex: optionIndex,
      isCorrect,
      timeMs: Date.now() - room.roundStartTime,
      points,
    };

    broadcastRoom(mapping.roomCode);

    // If all connected players have answered, finish round immediately
    const connected = Object.values(room.players).filter((p) => p.isConnected);
    if (connected.length > 0 && connected.every((p) => p.hasAnswered)) {
      const correctPlayers = connected.filter((p) => p.roundScore > 0).sort((a, b) => b.roundScore - a.roundScore);
      const winner = correctPlayers[0];
      const correctOptionText = q.options[q.correctAnswer];
      const summary = winner
        ? `🕵️ عرف الإجابة أسرع بطل وهو ${winner.nickname}! (+${winner.roundScore} نقطة)`
        : `انتهت جولة مين أنا! الإجابة الصحيحة هي: ${correctOptionText}`;
      finishRound(mapping.roomCode, summary, winner?.id, correctOptionText);
    }
  });

  // SUBMIT GUESS / CHAT SUBMISSION (Riddles, Combine Clues, Draw & Guess)
  socket.on('game:submit_guess', ({ text }: { text: string }) => {
    const mapping = socketToPlayerMap[socket.id];
    if (!mapping) return;
    const room = rooms[mapping.roomCode];
    if (!room || room.state !== 'in_round' || !room.roundData) return;

    const player = room.players[mapping.playerId];
    if (!player) return;

    const cleanText = (text || '').trim();
    if (!cleanText) return;

    // 1. RIDDLES GAME (Team-based competitive logic)
    if (room.currentMiniGame === 'riddles') {
      const rd = room.roundData;
      if (!rd.riddleQuestion) return;

      // Only allow players on active team to guess
      if (player.team !== rd.activeTeam) {
        return;
      }

      const isRiddleCorrect = checkArabicMatch(cleanText, rd.riddleQuestion.acceptedAnswers);

      const msg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        playerId: player.id,
        nickname: player.nickname,
        text: isRiddleCorrect ? `حل اللغز بشكل صحيح! 🎉 (${cleanText})` : cleanText,
        isCorrect: isRiddleCorrect,
        timestamp: Date.now(),
      };
      room.chatMessages.push(msg);

      if (isRiddleCorrect) {
        // Player who solved gets full solver points
        player.hasAnswered = true;
        player.correctGuessesCount += 1;
        player.riddleWins += 1;
        player.roundScore = 100;

        // Teammates on the same team get 40 team bonus points
        Object.values(room.players).forEach((p) => {
          if (p.id !== player.id && p.team === player.team && p.isConnected) {
            p.roundScore = 40;
          }
        });

        rd.winningTeam = player.team;
        rd.solvedBy = player.id;
        broadcastRoom(mapping.roomCode);

        const teamName = player.team === 1 ? 'الفريق الأول 🔴' : 'الفريق الثاني 🔵';
        finishRound(
          mapping.roomCode,
          `🎉 فاز ${teamName} بحل اللغز بواسطة البطل ${player.nickname}! (+100 نقطة)`,
          player.id,
          rd.riddleQuestion.acceptedAnswers[0]
        );
        return;
      } else {
        // Wrong Answer: Shift turn immediately to the other team!
        const otherTeam: 1 | 2 = rd.activeTeam === 1 ? 2 : 1;
        const otherTeamTime = otherTeam === 1 ? (rd.team1TimeLeft ?? 60) : (rd.team2TimeLeft ?? 60);

        rd.lastWrongAnswer = cleanText;
        rd.lastWrongPlayerName = player.nickname;
        rd.lastWrongTeam = player.team;

        if (otherTeamTime > 0) {
          rd.activeTeam = otherTeam;
          rd.turnStartTime = Date.now();

          const otherTeamName = otherTeam === 1 ? 'الفريق الأول 🔴' : 'الفريق الثاني 🔵';
          room.chatMessages.push({
            id: `sys_${Date.now()}`,
            playerId: 'system',
            nickname: 'نظام لودكس',
            text: `❌ إجابة خاطئة من ${player.nickname}! انتقل الدور إلى ${otherTeamName} 🔄`,
            isSystem: true,
            timestamp: Date.now(),
          });
        }

        broadcastRoom(mapping.roomCode);
        return;
      }
    }

    // 2. DRAW & GUESS (2-Team strict turn & 1-attempt system)
    if (room.currentMiniGame === 'draw_guess') {
      const rd = room.roundData;
      if (!rd || !rd.drawWord) return;

      // Artist cannot guess
      if (player.id === rd.activePlayerId || player.role === 'artist') {
        return;
      }

      // Opponents cannot guess during the active team's turn
      if (player.team !== rd.activeTeam) {
        return;
      }

      // Check if attempt is already used for active team
      const isTeam1 = rd.activeTeam === 1;
      if (isTeam1 && rd.team1AttemptUsed) {
        return;
      }
      if (!isTeam1 && rd.team2AttemptUsed) {
        return;
      }

      // Mark attempt used for this team
      if (isTeam1) {
        rd.team1AttemptUsed = true;
        rd.team1GuesserId = player.id;
        rd.team1GuessText = cleanText;
      } else {
        rd.team2AttemptUsed = true;
        rd.team2GuesserId = player.id;
        rd.team2GuessText = cleanText;
      }

      const isCorrect = checkArabicMatch(cleanText, [rd.drawWord]);

      const msg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        playerId: player.id,
        nickname: player.nickname,
        text: isCorrect ? `خمّن الكلمة الصحيحة! 🎉 (${cleanText})` : cleanText,
        isCorrect,
        timestamp: Date.now(),
      };
      room.chatMessages.push(msg);

      if (isCorrect) {
        player.hasAnswered = true;
        player.roundScore = 100;
        player.correctGuessesCount += 1;

        // Give points directly to the active team's artist
        const currentArtist = rd.activePlayerId ? room.players[rd.activePlayerId] : null;
        if (currentArtist) {
          currentArtist.roundScore = 80;
          currentArtist.drawingsWon += 1;
        }

        rd.winningTeam = player.team;
        rd.solvedBy = player.id;
        broadcastRoom(mapping.roomCode);

        const teamName = player.team === 1 ? 'الفريق الأول 🔴' : 'الفريق الثاني 🔵';
        finishRound(
          mapping.roomCode,
          `🎉 فاز ${teamName}! رسمها ${currentArtist?.nickname || 'الرسام'} وخمّنها ${player.nickname}! (+100 للمخمّن و +80 للرسام)`,
          player.id,
          rd.drawWord
        );
        return;
      } else {
        // Wrong Guess
        if (isTeam1) {
          // Transfer turn to Team 2
          rd.activeTeam = 2;
          rd.activePlayerId = rd.team2ArtistId;

          // Update player roles
          if (rd.team1ArtistId && room.players[rd.team1ArtistId]) {
            room.players[rd.team1ArtistId].role = 'player';
          }
          if (rd.team2ArtistId && room.players[rd.team2ArtistId]) {
            room.players[rd.team2ArtistId].role = 'artist';
          }

          // Clear canvas for Team 2
          room.drawingStrokes = [];
          io.to(mapping.roomCode).emit('draw:clear');

          const nextArtist = (rd.team2ArtistId && room.players[rd.team2ArtistId]?.nickname) || 'رسام الفريق الثاني';
          room.chatMessages.push({
            id: `sys_${Date.now()}`,
            playerId: 'system',
            nickname: 'نظام لودكس',
            text: `❌ تخمين خاطئ من الفريق الأول (${cleanText})! انتقلت الفرصة للفريق الثاني 🔵 (${nextArtist} يرسم الآن ولدى فريقه محاولة واحدة) 🔄`,
            isSystem: true,
            timestamp: Date.now(),
          });

          broadcastRoom(mapping.roomCode);
          return;
        } else {
          // Team 2 also wrong -> Round ends with 0 points for both teams!
          room.chatMessages.push({
            id: `sys_${Date.now()}`,
            playerId: 'system',
            nickname: 'نظام لودكس',
            text: `❌ تخمين خاطئ من الفريق الثاني (${cleanText})! انتهت محاولات الفريقين دون إجابة صحيحة.`,
            isSystem: true,
            timestamp: Date.now(),
          });

          broadcastRoom(mapping.roomCode);
          finishRound(
            mapping.roomCode,
            `انتهت محاولات الفريقين دون تخمين صحيح! الكلمة كانت: ${rd.drawWord}`,
            undefined,
            rd.drawWord
          );
          return;
        }
      }
    }

    // 3. COMBINE CLUES
    let isCorrect = false;
    let acceptedAnswers: string[] = [];

    if (room.currentMiniGame === 'combine_clues' && room.roundData.clueQuestion) {
      acceptedAnswers = room.roundData.clueQuestion.acceptedAnswers;
    }

    isCorrect = checkArabicMatch(cleanText, acceptedAnswers);

    const msg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      playerId: player.id,
      nickname: player.nickname,
      text: isCorrect ? `خمّن الكلمة الصحيحة! 🎉 (${cleanText})` : cleanText,
      isCorrect,
      timestamp: Date.now(),
    };

    room.chatMessages.push(msg);

    if (isCorrect && !player.hasAnswered) {
      player.hasAnswered = true;
      player.correctGuessesCount += 1;

      const remainingRatio = Math.max(0, (room.roundEndTime - Date.now()) / (room.roundDuration * 1000));
      const points = 60 + Math.round(remainingRatio * 40);
      player.roundScore = points;
      room.roundData.solvedBy = player.id;

      broadcastRoom(mapping.roomCode);

      // Finish round when first correct guess arrives
      finishRound(
        mapping.roomCode,
        `أول من خمّن الإجابة هو ${player.nickname}! (+${points} نقطة)`,
        player.id,
        acceptedAnswers[0]
      );
      return;
    }

    broadcastRoom(mapping.roomCode);
  });

  // MINI-GAME: DRAWING ACTIONS (Real-time Canvas Sync)
  socket.on('draw:stroke', (stroke: DrawStroke) => {
    const mapping = socketToPlayerMap[socket.id];
    if (!mapping) return;
    const room = rooms[mapping.roomCode];
    if (!room || room.state !== 'in_round' || room.currentMiniGame !== 'draw_guess') return;

    const player = room.players[mapping.playerId];
    if (!player || player.id !== room.roundData?.activePlayerId) return;

    room.drawingStrokes.push(stroke);
    socket.to(mapping.roomCode).emit('draw:stroke', stroke);
  });

  socket.on('draw:clear', () => {
    const mapping = socketToPlayerMap[socket.id];
    if (!mapping) return;
    const room = rooms[mapping.roomCode];
    if (!room || room.state !== 'in_round' || room.currentMiniGame !== 'draw_guess') return;

    const player = room.players[mapping.playerId];
    if (!player || player.id !== room.roundData?.activePlayerId) return;

    room.drawingStrokes = [];
    io.to(mapping.roomCode).emit('draw:clear');
  });

  socket.on('draw:undo', () => {
    const mapping = socketToPlayerMap[socket.id];
    if (!mapping) return;
    const room = rooms[mapping.roomCode];
    if (!room || room.state !== 'in_round' || room.currentMiniGame !== 'draw_guess') return;

    const player = room.players[mapping.playerId];
    if (!player || player.id !== room.roundData?.activePlayerId) return;

    room.drawingStrokes.pop();
    io.to(mapping.roomCode).emit('draw:sync', room.drawingStrokes);
  });

  // PLAY AGAIN ("العبوا مرة ثانية")
  socket.on('game:play_again', () => {
    const mapping = socketToPlayerMap[socket.id];
    if (!mapping) return;
    const room = rooms[mapping.roomCode];
    if (!room) return;

    const player = room.players[mapping.playerId];
    if (!player || !player.isHost) return;

    clearRoomTimer(mapping.roomCode);
    clearRoomInterval(mapping.roomCode);

    room.state = 'lobby';
    room.currentRound = 0;
    room.gameHistory = [];
    room.currentMiniGame = null;
    room.roundData = null;
    room.drawingStrokes = [];
    room.chatMessages = [];
    room.lastRoundResults = null;

    Object.values(room.players).forEach((p) => {
      p.score = 0;
      p.roundScore = 0;
      p.isReady = p.isHost;
      p.hasAnswered = false;
      p.tappedAt = undefined;
      p.answerTime = undefined;
      p.correctGuessesCount = 0;
      p.riddleWins = 0;
      p.drawingsWon = 0;
      p.penalties = 0;
      p.role = 'player';
    });

    broadcastRoom(mapping.roomCode);
  });

  // DISCONNECT & HOST MIGRATION
  socket.on('disconnect', () => {
    const mapping = socketToPlayerMap[socket.id];
    if (!mapping) return;

    const room = rooms[mapping.roomCode];
    if (!room) return;

    const player = room.players[mapping.playerId];
    if (player) {
      player.isConnected = false;

      // If host disconnected, migrate to next active player
      if (player.isHost) {
        player.isHost = false;
        const remaining = Object.values(room.players).filter((p) => p.isConnected);
        if (remaining.length > 0) {
          remaining[0].isHost = true;
          room.hostId = remaining[0].id;
        }
      }

      broadcastRoom(mapping.roomCode);
    }

    delete socketToPlayerMap[socket.id];
  });
});

async function startServer() {
  // API Health
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', activeRooms: Object.keys(rooms).length });
  });

  // Vite middleware in dev / static serve in prod
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`LODEKS Game Server running on port ${PORT}`);
  });
}

startServer();

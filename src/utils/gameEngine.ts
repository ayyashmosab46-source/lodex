import {
  MiniGameType,
  RoomData,
  Player,
  RoundResultData,
} from '../types/game';
import {
  RIDDLES_DATA,
  SOUNDS_DATA,
  CLUES_DATA,
  DRAW_WORDS,
  WHO_AM_I_DATA,
  WHAT_HAPPENED_DATA,
  FALCON_EYE_DATA,
  MEMORY_DATA,
} from '../data/content';
import { isArabicMatch } from './arabic';

export const MINI_GAMES: MiniGameType[] = [
  'riddles',
  'sound_guess',
  'what_happened',
  'combine_clues',
  'draw_guess',
  'who_am_i',
  'falcon_eye',
  'memory_game',
];

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getRandomAvatar(): string {
  const avatars = ['🦁', '🦅', '🐺', '🦊', '🐯', '🐼', '🦄', '🐲', '🚀', '👑', '⚡', '🔥'];
  return avatars[Math.floor(Math.random() * avatars.length)];
}

export function getRoundDuration(gameType: MiniGameType): number {
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

export function prepareRoundData(room: RoomData, gameType: MiniGameType) {
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

export function startRoundLogic(room: RoomData): MiniGameType | null {
  room.currentRound += 1;

  if (room.currentRound > room.totalRounds) {
    room.state = 'final_results';
    return null;
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

  // Alternate starting team between rounds
  const startingTeam: 1 | 2 = room.currentRound % 2 === 1 ? 1 : 2;
  room.activeTeam = startingTeam;
  room.teamTurnPhase = 1;
  room.teamTimeLeft = 30;

  prepareRoundData(room, nextGame);
  return nextGame;
}

export function endRoundLogic(
  room: RoomData,
  winnerPlayerId: string | null,
  customExplanation?: string
): RoundResultData {
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

  const playersList: Player[] = Object.values(room.players);
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

  return roundResults;
}

export function handleAnswerLogic(
  room: RoomData,
  playerId: string,
  answer: string
): { isCorrect: boolean; roundEnded: boolean; result?: RoundResultData } {
  if (!room || room.state !== 'playing' || !room.roundData) {
    return { isCorrect: false, roundEnded: false };
  }

  const player = room.players[playerId];
  if (!player) return { isCorrect: false, roundEnded: false };

  // Only the active team can answer (in draw_guess, guessers of active team or drawer logic)
  if (room.currentMiniGame !== 'draw_guess') {
    if (room.activeTeam && player.team !== room.activeTeam) {
      return { isCorrect: false, roundEnded: false };
    }
  }

  // Drawer cannot answer in draw_guess
  if (room.currentMiniGame === 'draw_guess' && room.roundData.drawerId === player.id) {
    return { isCorrect: false, roundEnded: false };
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

  if (isCorrect) {
    const result = endRoundLogic(room, player.id);
    return { isCorrect: true, roundEnded: true, result };
  }

  return { isCorrect: false, roundEnded: false };
}

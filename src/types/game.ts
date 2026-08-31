export type MiniGameType = 
  | 'riddles'         // الألغاز (تحدي الفرق - 60 ثانية)
  | 'sound_guess'     // وش الصوت؟ (بدون تلميحات)
  | 'what_happened'   // وش صار؟ (سؤال بوستر بدون فيديو/صوت)
  | 'combine_clues'   // ركّبها
  | 'draw_guess'      // ارسم وخمّن (محاولة واحدة لكل فريق)
  | 'who_am_i';       // مين أنا؟ (3 تلميحات تدريجية + 4 خيارات)

export interface Player {
  id: string;
  socketId: string;
  nickname: string;
  avatar: string;
  score: number;
  roundScore: number;
  isHost: boolean;
  isConnected: boolean;
  isReady: boolean;
  team: 1 | 2; // 1 = الفريق الأول, 2 = الفريق الثاني
  role?: 'artist' | 'guesser' | 'player';
  tappedAt?: number;
  hasAnswered?: boolean;
  answerTime?: number;
  correctGuessesCount: number;
  riddleWins: number;
  drawingsWon: number;
  penalties: number;
}

export interface DrawPoint {
  x: number;
  y: number;
}

export interface DrawStroke {
  points: DrawPoint[];
  color: string;
  size: number;
}

export interface SoundQuestion {
  id: string;
  title: string;
  soundType: string;
  options: string[];
  correctIndex: number;
  hint?: string;
}

export interface WhatHappenedQuestion {
  id: string;
  showName: 'Dexter' | 'Prison Break' | 'Breaking Bad' | 'Peaky Blinders' | 'Game of Thrones' | 'Squid Game' | 'Interstellar';
  showNameAr: string;
  imageUrl?: string;
  posterEmoji?: string;
  title: string;
  question: string;
  options: [string, string, string, string];
  correctAnswer: number; // 0, 1, 2, or 3
  difficulty: 'سهل' | 'متوسط' | 'صعب';
  sceneContext?: string;
}

export interface WhoAmIQuestion {
  id: string;
  category: string;
  characterName: string;
  hints: [string, string, string]; // Hint 1, Hint 2, Hint 3
  options: [string, string, string, string];
  correctAnswer: number; // 0, 1, 2, or 3
  showContext?: string;
  badgeEmoji?: string;
}

export interface ClueQuestion {
  id: string;
  clues: string[]; // 3 or 4 visual/emoji clues
  acceptedAnswers: string[];
  category: string;
  hint: string;
}

export interface RiddleQuestion {
  id: string;
  riddle: string;
  acceptedAnswers: string[];
  category: string;
  hint?: string;
}

export interface GameStats {
  fastestPlayerId?: string;
  mostCorrectPlayerId?: string;
  bestArtistPlayerId?: string;
  luckyPlayerId?: string;
  masterGuesserPlayerId?: string;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  nickname: string;
  text: string;
  isCorrect?: boolean;
  isSystem?: boolean;
  timestamp: number;
}

export type RoomState = 
  | 'lobby' 
  | 'round_intro' 
  | 'in_round' 
  | 'round_result' 
  | 'match_end';

export interface RoomData {
  code: string;
  hostId: string;
  players: Record<string, Player>;
  state: RoomState;
  currentRound: number;
  totalRounds: number;
  gameHistory: MiniGameType[];
  currentMiniGame: MiniGameType | null;
  roundStartTime: number;
  roundEndTime: number;
  roundDuration: number;
  
  // Specific round data
  roundData: {
    title: string;
    description: string;
    activePlayerId?: string; // artist
    riddleQuestion?: RiddleQuestion;
    activeTeam?: 1 | 2;
    team1TimeLeft?: number;
    team2TimeLeft?: number;
    turnStartTime?: number;
    lastWrongAnswer?: string;
    lastWrongPlayerName?: string;
    lastWrongTeam?: 1 | 2;
    soundQuestion?: SoundQuestion;
    whatHappenedQuestion?: WhatHappenedQuestion;
    whoAmIQuestion?: WhoAmIQuestion;
    revealedHintsCount?: number; // 1, 2, or 3
    playerAnswers?: Record<string, { answerIndex: number; isCorrect: boolean; timeMs: number; points: number }>;
    clueQuestion?: ClueQuestion;
    drawWord?: string;
    team1ArtistId?: string;
    team2ArtistId?: string;
    team1AttemptUsed?: boolean;
    team2AttemptUsed?: boolean;
    team1GuesserId?: string;
    team2GuesserId?: string;
    team1GuessText?: string;
    team2GuessText?: string;
    solvedBy?: string;
    winningTeam?: 1 | 2;
    firstCorrectPlayerId?: string;
  } | null;

  drawingStrokes: DrawStroke[];
  chatMessages: ChatMessage[];
  lastRoundResults: {
    miniGame: MiniGameType;
    scoresEarned: Record<string, number>;
    summaryText: string;
    correctAnswer?: string;
    winnerId?: string;
    winningTeam?: 1 | 2;
  } | null;
}

export const MINI_GAME_INFO: Record<MiniGameType, { nameAr: string; descAr: string; icon: string; color: string; duration: number }> = {
  riddles: {
    nameAr: "الألغاز",
    descAr: "تحدي الألغاز بين فريقين! 30 ثانية لكل فريق والخطأ ينقل اللغز فوراً!",
    icon: "💡",
    color: "from-amber-500 to-orange-500",
    duration: 65,
  },
  sound_guess: {
    nameAr: "وش الصوت؟",
    descAr: "استمع للصوت بدقة واختر الإجابة الصحيحة بأسرع ما عندك!",
    icon: "🔊",
    color: "from-purple-500 to-indigo-500",
    duration: 15,
  },
  what_happened: {
    nameAr: "وش صار؟",
    descAr: "سؤال سريع عن أشهر المسلسلات والأفلام! اختر الإجابة الصحيحة بأسرع ما عندك!",
    icon: "🎬",
    color: "from-amber-500 via-orange-500 to-rose-600",
    duration: 20,
  },
  combine_clues: {
    nameAr: "ركّبها",
    descAr: "اجمع الإيموجيات والتلميحات واستنتج الكلمة المقصودة!",
    icon: "🧩",
    color: "from-rose-500 to-pink-500",
    duration: 20,
  },
  draw_guess: {
    nameAr: "ارسم وخمّن",
    descAr: "الرسام يرسم لفريقه ولكل فريق محاولة واحدة فقط!",
    icon: "🎨",
    color: "from-cyan-500 to-blue-500",
    duration: 30,
  },
  who_am_i: {
    nameAr: "مين أنا؟",
    descAr: "3 تلميحات تدريجية! كلما عرفت الإجابة مبكراً كسبت نقاطاً أعلى (100 - 75 - 50)! 🕵️",
    icon: "🕵️",
    color: "from-emerald-500 via-teal-500 to-cyan-500",
    duration: 25,
  },
};

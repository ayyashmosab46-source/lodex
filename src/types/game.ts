export type MiniGameType = 
  | 'riddles'
  | 'sound_guess'
  | 'what_happened'
  | 'combine_clues'
  | 'draw_guess'
  | 'who_am_i';

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
  team: 1 | 2;
  correctGuessesCount: number;
  riddleWins: number;
  drawingsWon: number;
  penalties: number;
}

export type RoomState = 'lobby' | 'round_intro' | 'playing' | 'round_result' | 'final_results';

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  points: DrawingPoint[];
  color: string;
  size: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  nickname: string;
  text: string;
  timestamp: number;
  isCorrect?: boolean;
  isSystem?: boolean;
}

export interface RoundResultData {
  winnerPlayerId?: string | null;
  winnerTeam?: 1 | 2 | 'tie' | null;
  correctAnswer: string;
  pointsAwarded: Record<string, number>;
  explanation?: string;
  team1Score: number;
  team2Score: number;
  mediaUrl?: string;
}

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
  roundData: any;
  drawingStrokes: DrawingStroke[];
  chatMessages: ChatMessage[];
  lastRoundResults: RoundResultData | null;
}

import React from 'react';
import { Sparkles, Users, Trophy } from 'lucide-react';
import { Player } from '../types/game';

interface HeaderProps {
  roomCode?: string;
  currentPlayer?: Player | null;
  team1Score?: number;
  team2Score?: number;
  currentRound?: number;
  totalRounds?: number;
  onLeaveRoom?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomCode,
  currentPlayer,
  team1Score = 0,
  team2Score = 0,
  currentRound = 0,
  totalRounds = 10,
  onLeaveRoom,
}) => {
  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 px-4 py-2.5">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-amber-500/20">
            ل
          </div>
          <div>
            <h1 className="font-black text-base md:text-lg text-amber-400 leading-tight">
              لودكس <span className="text-xs text-slate-400 font-mono tracking-widest">LODEKS</span>
            </h1>
            {roomCode && (
              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                <span>غرفة:</span>
                <span className="text-amber-300 font-bold tracking-wider">{roomCode}</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Team Scores */}
        {roomCode && currentRound > 0 && (
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-blue-400">فريق 1:</span>
              <span className="text-white">{team1Score}</span>
            </div>
            <div className="text-slate-600">|</div>
            <div className="flex items-center gap-1.5 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-rose-400">فريق 2:</span>
              <span className="text-white">{team2Score}</span>
            </div>
          </div>
        )}

        {/* Player Profile & Leave */}
        <div className="flex items-center gap-2">
          {currentPlayer && (
            <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/60">
              <span className="text-lg">{currentPlayer.avatar}</span>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-200 leading-tight">{currentPlayer.nickname}</p>
                <p className="text-[10px] text-amber-400 font-mono font-bold">{currentPlayer.score} نقطة</p>
              </div>
            </div>
          )}

          {onLeaveRoom && roomCode && (
            <button
              onClick={onLeaveRoom}
              className="text-xs px-2.5 py-1 rounded-lg bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800/50 transition cursor-pointer"
            >
              خروج
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

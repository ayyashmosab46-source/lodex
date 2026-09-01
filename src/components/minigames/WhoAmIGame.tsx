import React, { useState } from 'react';
import { UserCheck, Send, Timer, Sparkles, Lock, Unlock } from 'lucide-react';
import { Player } from '../../types/game';

interface WhoAmIGameProps {
  roundData: {
    category: string;
    clues: [string, string, string];
    unlockedCluesCount: number;
    currentPoints: number;
  };
  currentPlayer: Player;
  roundTimeLeft: number;
  onSendAnswer: (answer: string) => void;
}

export const WhoAmIGame: React.FC<WhoAmIGameProps> = ({
  roundData,
  currentPlayer,
  roundTimeLeft,
  onSendAnswer,
}) => {
  const [inputAnswer, setInputAnswer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAnswer.trim()) return;
    onSendAnswer(inputAnswer.trim());
    setInputAnswer('');
  };

  const cluePoints = [100, 75, 50];

  return (
    <div className="max-w-xl mx-auto px-4 py-4 flex flex-col items-center">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between mb-4 bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
          <UserCheck className="w-4 h-4" />
          <span>مين أنا؟ ({roundData.category})</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg font-bold font-mono">
            {roundData.currentPoints} نقطة
          </span>
          <div className="flex items-center gap-1.5 font-mono font-bold text-amber-400 text-sm">
            <Timer className="w-4 h-4" />
            <span>{roundTimeLeft}ث</span>
          </div>
        </div>
      </div>

      {/* Clues Progressive Reveal */}
      <div className="w-full space-y-3 mb-6">
        {roundData.clues.map((clue, idx) => {
          const isUnlocked = idx < roundData.unlockedCluesCount;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${
                isUnlocked
                  ? 'bg-gradient-to-r from-cyan-950/40 via-slate-900/90 to-slate-900/90 border-cyan-500/40 shadow-lg text-white'
                  : 'bg-slate-950/40 border-slate-800 text-slate-600 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 text-xs font-bold">
                  {isUnlocked ? (
                    <Unlock className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                  )}
                  <span className={isUnlocked ? 'text-cyan-300' : 'text-slate-500'}>
                    تلميح {idx + 1}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-400/80">
                  {cluePoints[idx]} نقطة
                </span>
              </div>

              <p className="text-xs sm:text-sm font-bold leading-relaxed text-right">
                {isUnlocked ? clue : 'يتم فتح هذا التلميح لاحقاً مع تناقص النقاط...'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Answer Form */}
      <form onSubmit={handleSubmit} className="w-full flex gap-2">
        <input
          type="text"
          value={inputAnswer}
          onChange={(e) => setInputAnswer(e.target.value)}
          placeholder="من هي هذه الشخصية؟ (مثال: والتر وايت، ميسي...)"
          className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-2xl px-4 py-3.5 text-white placeholder-slate-500 text-sm outline-none font-bold transition"
          autoFocus
        />
        <button
          type="submit"
          disabled={!inputAnswer.trim()}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-cyan-500/20"
        >
          <Send className="w-4 h-4" />
          <span>تخمين</span>
        </button>
      </form>
    </div>
  );
};

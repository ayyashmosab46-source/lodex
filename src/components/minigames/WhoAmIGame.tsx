import React, { useState } from 'react';
import { UserCheck, Send, CheckCircle2, Lock, Unlock } from 'lucide-react';
import { Player } from '../../types/game';
import { TeamTurnBadge } from './TeamTurnBadge';

interface WhoAmIGameProps {
  roundData: {
    category: string;
    clues: [string, string, string];
    unlockedCluesCount: number;
    currentPoints: number;
    options?: string[];
  };
  currentPlayer: Player;
  activeTeam?: 1 | 2;
  teamTurnPhase?: 1 | 2;
  roundTimeLeft: number;
  onSendAnswer: (answer: string) => void;
}

export const WhoAmIGame: React.FC<WhoAmIGameProps> = ({
  roundData,
  currentPlayer,
  activeTeam = 1,
  teamTurnPhase = 1,
  roundTimeLeft,
  onSendAnswer,
}) => {
  const [inputAnswer, setInputAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const isMyTurn = currentPlayer.team === activeTeam;
  const cluePoints = [100, 75, 50];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMyTurn || !inputAnswer.trim()) return;
    onSendAnswer(inputAnswer.trim());
    setInputAnswer('');
  };

  const handleSelectOption = (option: string) => {
    if (!isMyTurn || selectedOption !== null) return;
    setSelectedOption(option);
    onSendAnswer(option);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-3 flex flex-col items-center">
      {/* Team Turn & Countdown Bar */}
      <TeamTurnBadge
        activeTeam={activeTeam}
        teamTurnPhase={teamTurnPhase}
        roundTimeLeft={roundTimeLeft}
        currentPlayer={currentPlayer}
      />

      {/* Header Info Banner */}
      <div className="w-full flex items-center justify-between mb-3 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
          <UserCheck className="w-4 h-4" />
          <span>مين أنا؟ (التصنيف: {roundData.category})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-lg font-black font-mono">
            {roundData.currentPoints} نقطة
          </span>
        </div>
      </div>

      {/* Clues Progressive Reveal */}
      <div className="w-full space-y-2.5 mb-3">
        {roundData.clues.map((clue, idx) => {
          const isUnlocked = idx < roundData.unlockedCluesCount;
          return (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border transition-all ${
                isUnlocked
                  ? 'bg-gradient-to-r from-cyan-950/40 via-slate-900/90 to-slate-900/90 border-cyan-500/40 shadow-lg text-white'
                  : 'bg-slate-950/40 border-slate-800 text-slate-600 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-xs font-bold">
                  {isUnlocked ? (
                    <Unlock className="w-3.5 h-3.5 text-cyan-400" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                  )}
                  <span className={isUnlocked ? 'text-cyan-300' : 'text-slate-500'}>
                    الدليل {idx + 1}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-400/80">
                  {cluePoints[idx]} نقطة
                </span>
              </div>

              <p className="text-xs sm:text-sm font-bold leading-relaxed text-right">
                {isUnlocked ? clue : 'يتم فتح هذا الدليل لاحقاً مع تناقص النقاط...'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Answer Choices (Multiple Choice Buttons) */}
      {roundData.options && roundData.options.length > 0 && (
        <div className="w-full mb-3">
          <p className="text-xs font-bold text-slate-400 mb-2 text-right">
            اختر الشخصية الصحيحة أو اكتب اسمها بالأسفل:
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {roundData.options.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(opt)}
                  disabled={!isMyTurn || selectedOption !== null}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between gap-2 text-xs sm:text-sm font-bold ${
                    isSelected
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-lg shadow-cyan-600/30'
                      : isMyTurn
                      ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-100 hover:border-cyan-500/50 cursor-pointer'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-5 h-5 rounded-lg bg-slate-950/60 border border-slate-700/60 flex items-center justify-center font-mono text-[11px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate">{opt}</span>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Answer Form */}
      <form onSubmit={handleSubmit} className="w-full flex gap-2">
        <input
          type="text"
          value={inputAnswer}
          onChange={(e) => setInputAnswer(e.target.value)}
          disabled={!isMyTurn}
          placeholder={
            isMyTurn
              ? 'من هي هذه الشخصية؟ (مثال: والتر وايت، ميسي...)'
              : 'انتظر دور فريقك للتخمين...'
          }
          className="flex-1 bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-2xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
          autoFocus={isMyTurn}
        />
        <button
          type="submit"
          disabled={!isMyTurn || !inputAnswer.trim()}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-cyan-500/20"
        >
          {isMyTurn ? <Send className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          <span>تخمين</span>
        </button>
      </form>
    </div>
  );
};

import React, { useState } from 'react';
import { Puzzle, Send, CheckCircle2, Lock } from 'lucide-react';
import { Player } from '../../types/game';
import { TeamTurnBadge } from './TeamTurnBadge';

interface CombineCluesGameProps {
  roundData: {
    theme: string;
    clues: [string, string, string, string];
    options?: string[];
  };
  currentPlayer: Player;
  activeTeam?: 1 | 2;
  teamTurnPhase?: 1 | 2;
  roundTimeLeft: number;
  onSendAnswer: (answer: string) => void;
}

export const CombineCluesGame: React.FC<CombineCluesGameProps> = ({
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

      {/* Clues 4 Cards Grid */}
      <div className="w-full mb-4 bg-slate-900/60 p-4 rounded-3xl border border-slate-800">
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-xs text-blue-400 font-bold">
            التصنيف: {roundData.theme}
          </p>
          <span className="text-[11px] text-slate-400">
            ما الكلمة التي تجمع الدلائل الأربعة؟
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {roundData.clues.map((clue, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-b from-blue-950/40 to-slate-900/90 border border-blue-500/30 rounded-2xl p-3.5 text-center shadow-lg flex flex-col items-center justify-center min-h-[75px]"
            >
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[11px] font-mono font-bold flex items-center justify-center mb-1.5">
                {idx + 1}
              </span>
              <p className="text-xs sm:text-sm font-bold text-white leading-snug">{clue}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Answer Choices (Multiple Choice Buttons) */}
      {roundData.options && roundData.options.length > 0 && (
        <div className="w-full mb-4">
          <p className="text-xs font-bold text-slate-400 mb-2 text-right">
            اختر الكلمة المشتركة أو اكتبها بالأسفل:
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
                      ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30'
                      : isMyTurn
                      ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-100 hover:border-blue-500/50 cursor-pointer'
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
              ? 'اكتب الكلمة المشتركة هنا...'
              : 'انتظر دور فريقك للإجابة...'
          }
          className="flex-1 bg-slate-900 border border-slate-700 focus:border-blue-400 rounded-2xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
          autoFocus={isMyTurn}
        />
        <button
          type="submit"
          disabled={!isMyTurn || !inputAnswer.trim()}
          className="bg-blue-500 hover:bg-blue-400 text-slate-950 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-blue-500/20"
        >
          {isMyTurn ? <Send className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          <span>إرسال</span>
        </button>
      </form>
    </div>
  );
};

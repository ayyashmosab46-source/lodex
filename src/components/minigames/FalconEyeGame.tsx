import React, { useState } from 'react';
import { Eye, Send, CheckCircle2, Lock } from 'lucide-react';
import { Player } from '../../types/game';
import { TeamTurnBadge } from './TeamTurnBadge';

interface FalconEyeGameProps {
  roundData: {
    title: string;
    category: string;
    sceneIcon: string;
    sceneDescription: string;
    visualGrid: Array<{ icon: string; label: string; count?: number; color?: string }>;
    question: string;
    options: string[];
  };
  currentPlayer: Player;
  activeTeam?: 1 | 2;
  teamTurnPhase?: 1 | 2;
  roundTimeLeft: number;
  onSendAnswer: (answer: string) => void;
}

export const FalconEyeGame: React.FC<FalconEyeGameProps> = ({
  roundData,
  currentPlayer,
  activeTeam = 1,
  teamTurnPhase = 1,
  roundTimeLeft,
  onSendAnswer,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [inputAnswer, setInputAnswer] = useState('');

  const isMyTurn = currentPlayer.team === activeTeam;

  const handleSelect = (idx: number) => {
    if (!isMyTurn || selectedOption !== null) return;
    setSelectedOption(idx);
    onSendAnswer(idx.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMyTurn || !inputAnswer.trim()) return;
    onSendAnswer(inputAnswer.trim());
    setInputAnswer('');
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

      {/* Visual Scene Card */}
      <div className="w-full bg-gradient-to-b from-amber-950/30 via-slate-900/90 to-slate-900/90 border border-amber-500/30 rounded-3xl p-5 shadow-2xl mb-4">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl p-1.5 rounded-xl bg-slate-950 border border-slate-800">
              {roundData.sceneIcon || '🦅'}
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-black text-amber-300">
                عين الصقر: {roundData.title}
              </h2>
              <p className="text-[11px] text-slate-400">تحدي دقة الملاحظة البصرية الخارقة</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30">
            <Eye className="w-3.5 h-3.5" />
            <span>راقب المشهد</span>
          </div>
        </div>

        {/* Scene Visual Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {roundData.visualGrid &&
            roundData.visualGrid.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-2.5 flex flex-col items-center justify-center text-center shadow-inner"
              >
                <span className="text-2xl sm:text-3xl mb-1">{item.icon}</span>
                <span className="text-xs font-bold text-white leading-tight">{item.label}</span>
                {item.count !== undefined && (
                  <span className={`text-[11px] font-mono font-bold mt-0.5 ${item.color || 'text-amber-400'}`}>
                    العدد: {item.count}
                  </span>
                )}
              </div>
            ))}
        </div>

        {/* Scene Description Box */}
        <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 mb-3 text-xs text-slate-300 leading-relaxed text-right">
          🔍 {roundData.sceneDescription}
        </div>

        {/* Question Prompt */}
        <h3 className="text-xs sm:text-sm font-black text-white text-center leading-snug">
          ❓ {roundData.question}
        </h3>
      </div>

      {/* Answer Choices (Multiple Choice Buttons) */}
      {roundData.options && roundData.options.length > 0 && (
        <div className="w-full mb-3">
          <p className="text-xs font-bold text-slate-400 mb-2 text-right">
            اختر الإجابة الصحيحة أو اكتبها بالأسفل:
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {roundData.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(idx)}
                  disabled={!isMyTurn || selectedOption !== null}
                  className={`p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between gap-2 text-xs sm:text-sm font-bold ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/30'
                      : isMyTurn
                      ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-100 hover:border-amber-500/50 cursor-pointer'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-5 h-5 rounded-lg bg-slate-950/60 border border-slate-700/60 flex items-center justify-center font-mono text-[11px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate">{opt}</span>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 shrink-0 text-slate-950" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Optional Free Text Form */}
      <form onSubmit={handleSubmit} className="w-full flex gap-2">
        <input
          type="text"
          value={inputAnswer}
          onChange={(e) => setInputAnswer(e.target.value)}
          disabled={!isMyTurn}
          placeholder={
            isMyTurn
              ? 'أو اكتب الإجابة هنا مباشرة...'
              : 'انتظر دور فريقك للإجابة...'
          }
          className="flex-1 bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-2xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
          autoFocus={isMyTurn}
        />
        <button
          type="submit"
          disabled={!isMyTurn || !inputAnswer.trim()}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-amber-500/20"
        >
          {isMyTurn ? <Send className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          <span>إرسال</span>
        </button>
      </form>
    </div>
  );
};

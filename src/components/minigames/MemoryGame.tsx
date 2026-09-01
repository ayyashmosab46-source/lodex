import React, { useState, useEffect } from 'react';
import { Brain, Send, CheckCircle2, Lock, Sparkles, HelpCircle } from 'lucide-react';
import { Player } from '../../types/game';
import { TeamTurnBadge } from './TeamTurnBadge';

interface MemoryGameProps {
  roundData: {
    title: string;
    category: string;
    itemsToMemorize: Array<{ id: string; icon: string; name: string; tag?: string }>;
    question: string;
    options: string[];
  };
  currentPlayer: Player;
  activeTeam?: 1 | 2;
  teamTurnPhase?: 1 | 2;
  roundTimeLeft: number;
  onSendAnswer: (answer: string) => void;
}

export const MemoryGame: React.FC<MemoryGameProps> = ({
  roundData,
  currentPlayer,
  activeTeam = 1,
  teamTurnPhase = 1,
  roundTimeLeft,
  onSendAnswer,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [inputAnswer, setInputAnswer] = useState('');
  const [isMemorizePhase, setIsMemorizePhase] = useState(true);
  const [memorizeCountdown, setMemorizeCountdown] = useState(7);

  const isMyTurn = currentPlayer.team === activeTeam;

  useEffect(() => {
    // Initial 7-second reveal for players to memorize the items
    setIsMemorizePhase(true);
    setMemorizeCountdown(7);

    const interval = setInterval(() => {
      setMemorizeCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsMemorizePhase(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [roundData.title]);

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

      {/* Main Memory Board */}
      <div className="w-full bg-gradient-to-b from-indigo-950/40 via-slate-900/90 to-slate-900/90 border border-indigo-500/30 rounded-3xl p-5 shadow-2xl mb-4">
        {/* Header with Phase Badge */}
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl p-1.5 rounded-xl bg-slate-950 border border-slate-800">
              🧠
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-black text-indigo-300">
                تحدي الذاكرة: {roundData.title}
              </h2>
              <p className="text-[11px] text-slate-400">تذكر العناصر والتفاصيل بدقة وسرعة</p>
            </div>
          </div>

          {isMemorizePhase ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/30 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>احفظ العناصر ({memorizeCountdown}ث)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30">
              <Brain className="w-3.5 h-3.5" />
              <span>وقت الإجابة!</span>
            </div>
          )}
        </div>

        {/* Memory Items Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
          {roundData.itemsToMemorize &&
            roundData.itemsToMemorize.map((item, idx) => (
              <div
                key={idx}
                className={`rounded-2xl p-2.5 flex flex-col items-center justify-center text-center transition-all duration-500 min-h-[85px] border ${
                  isMemorizePhase
                    ? 'bg-slate-950/90 border-indigo-500/50 shadow-lg scale-100'
                    : 'bg-slate-950/60 border-slate-800 opacity-90'
                }`}
              >
                {isMemorizePhase ? (
                  <>
                    <span className="text-2xl mb-1">{item.icon}</span>
                    <span className="text-[10px] font-bold text-white leading-tight truncate w-full">
                      {item.name}
                    </span>
                    {item.tag && (
                      <span className="text-[9px] text-indigo-300/80 font-mono mt-0.5">
                        {item.tag}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-7 h-7 text-indigo-400/50 my-1 animate-pulse" />
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      عنصر {idx + 1}
                    </span>
                  </>
                )}
              </div>
            ))}
        </div>

        {/* Question Prompt */}
        <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-center">
          <h3 className="text-xs sm:text-sm font-black text-white leading-snug">
            ❓ {roundData.question}
          </h3>
        </div>
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
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30'
                      : isMyTurn
                      ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-700 text-slate-100 hover:border-indigo-500/50 cursor-pointer'
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

      {/* Optional Free Text Form */}
      <form onSubmit={handleSubmit} className="w-full flex gap-2">
        <input
          type="text"
          value={inputAnswer}
          onChange={(e) => setInputAnswer(e.target.value)}
          disabled={!isMyTurn}
          placeholder={
            isMyTurn
              ? 'أو اكتب إجابتك هنا مباشرة...'
              : 'انتظر دور فريقك للإجابة...'
          }
          className="flex-1 bg-slate-900 border border-slate-700 focus:border-indigo-400 rounded-2xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
          autoFocus={isMyTurn}
        />
        <button
          type="submit"
          disabled={!isMyTurn || !inputAnswer.trim()}
          className="bg-indigo-500 hover:bg-indigo-400 text-white px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-indigo-500/20"
        >
          {isMyTurn ? <Send className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          <span>إرسال</span>
        </button>
      </form>
    </div>
  );
};

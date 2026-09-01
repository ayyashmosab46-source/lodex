import React, { useState, useEffect } from 'react';
import { HelpCircle, Send, Timer, Lightbulb, CheckCircle2 } from 'lucide-react';
import { Player } from '../../types/game';

interface RiddlesGameProps {
  roundData: {
    question: string;
    hint: string;
  };
  currentPlayer: Player;
  roundTimeLeft: number;
  onSendAnswer: (answer: string) => void;
}

export const RiddlesGame: React.FC<RiddlesGameProps> = ({
  roundData,
  currentPlayer,
  roundTimeLeft,
  onSendAnswer,
}) => {
  const [inputAnswer, setInputAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAnswer.trim()) return;
    onSendAnswer(inputAnswer.trim());
    setInputAnswer('');
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 flex flex-col items-center">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between mb-4 bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
          <HelpCircle className="w-4 h-4" />
          <span>تحدي الألغاز والذكاء</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono font-bold text-amber-400 text-sm">
          <Timer className="w-4 h-4" />
          <span>{roundTimeLeft} ثانية</span>
        </div>
      </div>

      {/* Riddle Box */}
      <div className="w-full bg-gradient-to-b from-emerald-950/40 via-slate-900/90 to-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center mb-5">
        <span className="inline-block p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
          <HelpCircle className="w-8 h-8" />
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-white leading-relaxed mb-4">
          "{roundData.question}"
        </h2>

        {/* Hint button */}
        {showHint ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 text-xs text-amber-300 flex items-center justify-center gap-2 animate-fadeIn">
            <Lightbulb className="w-4 h-4 shrink-0 text-amber-400" />
            <span>تلميح: {roundData.hint}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowHint(true)}
            className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 mx-auto transition cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>إظهار تلميح اللغز</span>
          </button>
        )}
      </div>

      {/* Answer Form */}
      <form onSubmit={handleSubmit} className="w-full flex gap-2">
        <input
          type="text"
          value={inputAnswer}
          onChange={(e) => setInputAnswer(e.target.value)}
          placeholder="اكتب إجابتك هنا واضغط إرسال..."
          className="flex-1 bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded-2xl px-4 py-3.5 text-white placeholder-slate-500 text-sm outline-none font-bold transition"
          autoFocus
        />
        <button
          type="submit"
          disabled={!inputAnswer.trim()}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-emerald-500/20"
        >
          <Send className="w-4 h-4" />
          <span>إرسال</span>
        </button>
      </form>
    </div>
  );
};

import React, { useState } from 'react';
import { Puzzle, Send, Timer, Sparkles } from 'lucide-react';
import { Player } from '../../types/game';

interface CombineCluesGameProps {
  roundData: {
    theme: string;
    clues: [string, string, string, string];
  };
  currentPlayer: Player;
  roundTimeLeft: number;
  onSendAnswer: (answer: string) => void;
}

export const CombineCluesGame: React.FC<CombineCluesGameProps> = ({
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

  return (
    <div className="max-w-xl mx-auto px-4 py-4 flex flex-col items-center">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between mb-4 bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
          <Puzzle className="w-4 h-4" />
          <span>ركّبها (التصنيف: {roundData.theme})</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono font-bold text-amber-400 text-sm">
          <Timer className="w-4 h-4" />
          <span>{roundTimeLeft} ثانية</span>
        </div>
      </div>

      {/* Clues 4 Cards Grid */}
      <div className="w-full mb-6">
        <p className="text-xs text-slate-400 font-bold mb-3 text-center">
          ما هي الكلمة الواحدة التي تجمع هذه الدلائل الأربعة؟
        </p>
        <div className="grid grid-cols-2 gap-3">
          {roundData.clues.map((clue, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-b from-blue-950/40 to-slate-900/90 border border-blue-500/30 rounded-2xl p-4 text-center shadow-lg flex flex-col items-center justify-center min-h-[90px]"
            >
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-mono font-bold flex items-center justify-center mb-2">
                {idx + 1}
              </span>
              <p className="text-xs sm:text-sm font-bold text-white leading-snug">{clue}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Answer Form */}
      <form onSubmit={handleSubmit} className="w-full flex gap-2">
        <input
          type="text"
          value={inputAnswer}
          onChange={(e) => setInputAnswer(e.target.value)}
          placeholder="اكتب الكلمة المشتركة هنا..."
          className="flex-1 bg-slate-900 border border-slate-700 focus:border-blue-400 rounded-2xl px-4 py-3.5 text-white placeholder-slate-500 text-sm outline-none font-bold transition"
          autoFocus
        />
        <button
          type="submit"
          disabled={!inputAnswer.trim()}
          className="bg-blue-500 hover:bg-blue-400 text-slate-950 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-blue-500/20"
        >
          <Send className="w-4 h-4" />
          <span>إرسال</span>
        </button>
      </form>
    </div>
  );
};

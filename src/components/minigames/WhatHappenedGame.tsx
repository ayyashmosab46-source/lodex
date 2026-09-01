import React, { useState } from 'react';
import { Film, CheckCircle2, Timer, HelpCircle } from 'lucide-react';
import { Player } from '../../types/game';

interface WhatHappenedGameProps {
  roundData: {
    showTitle: string;
    showPoster: string;
    sceneDescription: string;
    question: string;
    options: string[];
  };
  currentPlayer: Player;
  roundTimeLeft: number;
  onSendAnswer: (answer: string) => void;
}

export const WhatHappenedGame: React.FC<WhatHappenedGameProps> = ({
  roundData,
  currentPlayer,
  roundTimeLeft,
  onSendAnswer,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleSelect = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    onSendAnswer(idx.toString());
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 flex flex-col items-center">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between mb-4 bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
          <Film className="w-4 h-4" />
          <span>وش صار؟ ({roundData.showTitle})</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono font-bold text-amber-400 text-sm">
          <Timer className="w-4 h-4" />
          <span>{roundTimeLeft} ثانية</span>
        </div>
      </div>

      {/* Scene Question Card */}
      <div className="w-full bg-gradient-to-b from-purple-950/40 via-slate-900/90 to-slate-900/90 border border-purple-500/30 rounded-3xl p-6 shadow-2xl mb-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl p-2 rounded-2xl bg-slate-950 border border-slate-800">
            {roundData.showPoster}
          </span>
          <div>
            <h2 className="text-base font-black text-purple-300">{roundData.showTitle}</h2>
            <p className="text-xs text-slate-400">تحدي الأحداث والمشاهد السينمائية</p>
          </div>
        </div>

        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 mb-4 text-xs text-slate-300 leading-relaxed text-right">
          🎬 {roundData.sceneDescription}
        </div>

        <h3 className="text-sm sm:text-base font-black text-white text-center leading-snug">
          ❓ {roundData.question}
        </h3>
      </div>

      {/* Options List */}
      <div className="w-full space-y-2.5">
        {roundData.options.map((opt, idx) => {
          const isSelected = selectedOption === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(idx)}
              disabled={selectedOption !== null}
              className={`w-full p-4 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 text-xs sm:text-sm font-bold cursor-pointer ${
                isSelected
                  ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/30'
                  : 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-800 text-slate-200'
              } disabled:cursor-not-allowed`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-slate-950/60 border border-slate-700/60 flex items-center justify-center font-mono text-xs">
                  {idx + 1}
                </span>
                <span>{opt}</span>
              </div>
              {isSelected && <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

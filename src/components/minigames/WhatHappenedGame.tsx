import React, { useState } from 'react';
import { Film, CheckCircle2 } from 'lucide-react';
import { Player } from '../../types/game';
import { TeamTurnBadge } from './TeamTurnBadge';

interface WhatHappenedGameProps {
  roundData: {
    showTitle: string;
    showPoster: string;
    sceneDescription: string;
    question: string;
    options: string[];
  };
  currentPlayer: Player;
  activeTeam?: 1 | 2;
  teamTurnPhase?: 1 | 2;
  roundTimeLeft: number;
  onSendAnswer: (answer: string) => void;
}

export const WhatHappenedGame: React.FC<WhatHappenedGameProps> = ({
  roundData,
  currentPlayer,
  activeTeam = 1,
  teamTurnPhase = 1,
  roundTimeLeft,
  onSendAnswer,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const isMyTurn = currentPlayer.team === activeTeam;

  const handleSelect = (idx: number) => {
    if (!isMyTurn || selectedOption !== null) return;
    setSelectedOption(idx);
    onSendAnswer(idx.toString());
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

      {/* Scene Question Card */}
      <div className="w-full bg-gradient-to-b from-purple-950/40 via-slate-900/90 to-slate-900/90 border border-purple-500/30 rounded-3xl p-5 shadow-2xl mb-4">
        <div className="flex items-center gap-3 mb-2.5">
          <span className="text-3xl p-2 rounded-2xl bg-slate-950 border border-slate-800">
            {roundData.showPoster}
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-black text-purple-300">{roundData.showTitle}</h2>
            <p className="text-[11px] text-slate-400">تحدي الأحداث والمشاهد السينمائية</p>
          </div>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 mb-3 text-xs text-slate-300 leading-relaxed text-right">
          🎬 {roundData.sceneDescription}
        </div>

        <h3 className="text-xs sm:text-sm font-black text-white text-center leading-snug">
          ❓ {roundData.question}
        </h3>
      </div>

      {/* Options List */}
      <div className="w-full space-y-2">
        {roundData.options.map((opt, idx) => {
          const isSelected = selectedOption === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(idx)}
              disabled={!isMyTurn || selectedOption !== null}
              className={`w-full p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 text-xs sm:text-sm font-bold ${
                isSelected
                  ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/30'
                  : isMyTurn
                  ? 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-800 hover:border-purple-500/50 text-slate-200 cursor-pointer'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-slate-950/60 border border-slate-700/60 flex items-center justify-center font-mono text-xs shrink-0">
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

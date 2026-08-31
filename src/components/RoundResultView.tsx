import React, { useEffect } from 'react';
import { RoomData, Player } from '../types/game';
import { Trophy, ArrowLeft, CheckCircle2, Award, Zap, Sparkles } from 'lucide-react';
import { playVictoryFanfare } from '../utils/audio';

interface RoundResultViewProps {
  room: RoomData;
  currentPlayer: Player;
}

export const RoundResultView: React.FC<RoundResultViewProps> = ({ room, currentPlayer }) => {
  const result = room.lastRoundResults;
  const players = (Object.values(room.players) as Player[]).sort((a, b) => b.score - a.score);

  useEffect(() => {
    if (result && result.winnerId === currentPlayer.id) {
      playVictoryFanfare();
    }
  }, [result, currentPlayer.id]);

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 flex flex-col items-center justify-between min-h-[calc(100vh-80px)] text-center animate-hit">
      {/* Top Banner */}
      <div className="w-full glass-panel rounded-3xl p-5 border border-slate-800 shadow-xl mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs mb-2">
          <Award size={14} />
          <span>نتيجة الجولة {room.currentRound} من {room.totalRounds}</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white mb-1">
          {result?.summaryText || 'انتهت الجولة!'}
        </h2>

        {result?.correctAnswer && (
          <div className="mt-2 text-xs font-bold text-slate-300 bg-slate-900/90 py-1.5 px-3 rounded-xl border border-slate-800 inline-block">
            الإجابة الصحيحة: <span className="text-amber-400 font-extrabold">{result.correctAnswer}</span>
          </div>
        )}
      </div>

      {/* Leaderboard Table */}
      <div className="w-full glass-panel rounded-3xl p-4 border border-slate-800 flex-1 flex flex-col mb-3">
        <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>الترتيب العام</span>
          <span>النقاط</span>
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto max-h-64 pr-1">
          {players.map((p, idx) => {
            const isMe = p.id === currentPlayer.id;
            const roundScore = result?.scoresEarned[p.id] || 0;

            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  isMe
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-black text-slate-400 w-4">
                    #{idx + 1}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                    {p.avatar}
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="font-extrabold text-sm text-white">
                      {p.nickname} {isMe && <span className="text-[10px] text-amber-400">(أنت)</span>}
                    </span>
                  </div>
                </div>

                {/* Score and Earned Delta */}
                <div className="flex items-center gap-2">
                  {roundScore !== 0 && (
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                        roundScore > 0
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-red-950 text-red-400 border border-red-800'
                      }`}
                    >
                      {roundScore > 0 ? `+${roundScore}` : `${roundScore}`}
                    </span>
                  )}
                  <span className="font-mono font-black text-base text-amber-400">
                    {p.score}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Countdown next round footer */}
      <div className="w-full text-center py-2 text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
        <Sparkles size={14} className="text-amber-400 animate-spin" />
        <span>الانتقال للجولة التالية خلال ثوانٍ...</span>
      </div>
    </div>
  );
};

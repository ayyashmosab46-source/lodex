import React from 'react';
import { Timer, Users, ShieldAlert, Zap } from 'lucide-react';
import { Player } from '../../types/game';

interface TeamTurnBadgeProps {
  activeTeam: 1 | 2;
  teamTurnPhase?: 1 | 2;
  roundTimeLeft: number;
  currentPlayer: Player;
}

export const TeamTurnBadge: React.FC<TeamTurnBadgeProps> = ({
  activeTeam,
  teamTurnPhase = 1,
  roundTimeLeft,
  currentPlayer,
}) => {
  const isMyTurn = currentPlayer.team === activeTeam;
  const isTeam1 = activeTeam === 1;

  return (
    <div className="w-full mb-4 space-y-2">
      {/* Top Bar: Team indicator & Countdown */}
      <div
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl border transition-all ${
          isTeam1
            ? 'bg-gradient-to-r from-red-950/70 via-slate-900 to-slate-900 border-red-500/40 shadow-lg shadow-red-500/10'
            : 'bg-gradient-to-r from-blue-950/70 via-slate-900 to-slate-900 border-blue-500/40 shadow-lg shadow-blue-500/10'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`w-3 h-3 rounded-full animate-ping shrink-0 ${
              isTeam1 ? 'bg-red-500' : 'bg-blue-500'
            }`}
          />
          <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
            <Users className={`w-4 h-4 ${isTeam1 ? 'text-red-400' : 'text-blue-400'}`} />
            <span className={isTeam1 ? 'text-red-300' : 'text-blue-300'}>
              دور: {isTeam1 ? 'الفريق الأول (الأحمر) 🔴' : 'الفريق الثاني (الأزرق) 🔵'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-lg border border-slate-700">
            {teamTurnPhase === 1 ? 'المحاولة 1' : 'المحاولة 2 (فرصة الخطف)'}
          </span>
          <div
            className={`flex items-center gap-1 font-mono font-black text-sm sm:text-base px-2.5 py-0.5 rounded-xl border ${
              roundTimeLeft <= 5
                ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}
          >
            <Timer className="w-4 h-4" />
            <span>{roundTimeLeft}ث</span>
          </div>
        </div>
      </div>

      {/* Sub-banner: Player Action Status */}
      <div
        className={`w-full py-2 px-3 rounded-xl border text-center text-xs font-black flex items-center justify-center gap-2 transition-all ${
          isMyTurn
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-500/10 animate-pulse'
            : 'bg-slate-900/90 border-slate-800 text-slate-400'
        }`}
      >
        {isMyTurn ? (
          <>
            <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>🔥 دور فريقك الآن للإجابة! اختر إجابة أو اكتبها سريعاً قبل انتهاء الوقت</span>
          </>
        ) : (
          <>
            <ShieldAlert className="w-4 h-4 text-amber-400/80 shrink-0" />
            <span>
              ⏳ دور الفريق المنافس الآن ({isTeam1 ? 'الفريق 1 🔴' : 'الفريق 2 🔵'}) - إذا أخطأ أو نفد وقته ينتقل الدور إليكم!
            </span>
          </>
        )}
      </div>
    </div>
  );
};

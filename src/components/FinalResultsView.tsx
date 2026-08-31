import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RoomData, Player } from '../types/game';
import { Trophy, RotateCcw, Home, Sparkles, Medal, Award, Flame, Zap } from 'lucide-react';
import { playVictoryFanfare, playClickSound } from '../utils/audio';

interface FinalResultsViewProps {
  room: RoomData;
  currentPlayer: Player;
  onPlayAgain: () => void;
  onLeave: () => void;
}

export const FinalResultsView: React.FC<FinalResultsViewProps> = ({
  room,
  currentPlayer,
  onPlayAgain,
  onLeave,
}) => {
  const players = (Object.values(room.players) as Player[]).sort((a, b) => b.score - a.score);
  const first = players[0];
  const second = players[1];
  const third = players[2];
  const remaining = players.slice(3);

  const isHost = currentPlayer.isHost;

  useEffect(() => {
    playVictoryFanfare();

    // Trigger celebratory confetti cannon
    const end = Date.now() + 3.5 * 1000;
    const colors = ['#f59e0b', '#ec4899', '#6366f1', '#10b981', '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  // Compute fun player titles
  const getPlayerTitle = (p: Player, rank: number): { title: string; icon: string; color: string } => {
    if (rank === 0) {
      return { title: 'بطل لودكس 🏆', icon: '👑', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    }
    if ((p.riddleWins || 0) > 0) {
      return { title: 'داهية الألغاز 💡', icon: '💡', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    }
    if (p.drawingsWon > 0) {
      return { title: 'الفنان المبدع 🎨', icon: '🎨', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
    }
    if (p.correctGuessesCount >= 3) {
      return { title: 'ملك التخمين 👀', icon: '🧠', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
    }
    if (rank === 1) {
      return { title: 'عبقري الجولة 🧠', icon: '🥈', color: 'text-slate-300 bg-slate-500/10 border-slate-500/30' };
    }
    return { title: 'أكثر واحد حظًا 🍀', icon: '🍀', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 flex flex-col items-center justify-between min-h-[calc(100vh-80px)] text-center animate-hit">
      {/* Header Announcement */}
      <div className="w-full mb-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs mb-1">
          <Sparkles size={14} className="text-amber-400" />
          <span>اختتام المباراة</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white font-['Cairo']">
          انتهت اللعبة 🎉
        </h1>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">
          10 جولات حماسية ومنافسة شرسة بين الأصدقاء!
        </p>
      </div>

      {/* Podium Top 3 View */}
      <div className="w-full grid grid-cols-3 gap-2 items-end my-2 px-1">
        {/* 2nd Place */}
        {second && (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border-2 border-slate-400 flex items-center justify-center text-2xl mb-1 shadow-md">
              {second.avatar}
            </div>
            <div className="text-xs font-black text-white truncate max-w-[80px]">
              {second.nickname}
            </div>
            <div className="text-[11px] font-mono font-bold text-slate-300">
              {second.score} نقطة
            </div>
            <div className="w-full h-24 bg-gradient-to-t from-slate-800 to-slate-700/80 rounded-t-2xl flex flex-col items-center justify-center mt-2 border-t-2 border-slate-400">
              <span className="text-xl">🥈</span>
              <span className="text-[11px] font-bold text-slate-300">المركز 2</span>
            </div>
          </div>
        )}

        {/* 1st Place (Center Big) */}
        {first && (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-4xl mb-1 shadow-xl shadow-amber-500/30 animate-bounce">
              {first.avatar}
            </div>
            <div className="text-sm font-black text-amber-400 truncate max-w-[100px]">
              {first.nickname}
            </div>
            <div className="text-xs font-mono font-black text-white">
              {first.score} نقطة
            </div>
            <div className="w-full h-32 bg-gradient-to-t from-amber-600 via-amber-500 to-yellow-400 rounded-t-2xl flex flex-col items-center justify-center mt-2 shadow-lg shadow-amber-500/20 text-slate-950">
              <span className="text-3xl">🏆</span>
              <span className="text-xs font-black">المركز 1</span>
              <span className="text-[10px] font-black uppercase">بطل لودكس</span>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {third && (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border-2 border-amber-700 flex items-center justify-center text-2xl mb-1 shadow-md">
              {third.avatar}
            </div>
            <div className="text-xs font-black text-white truncate max-w-[80px]">
              {third.nickname}
            </div>
            <div className="text-[11px] font-mono font-bold text-amber-600">
              {third.score} نقطة
            </div>
            <div className="w-full h-18 bg-gradient-to-t from-slate-900 to-amber-950/60 rounded-t-2xl flex flex-col items-center justify-center mt-2 border-t-2 border-amber-700">
              <span className="text-xl">🥉</span>
              <span className="text-[11px] font-bold text-amber-500">المركز 3</span>
            </div>
          </div>
        )}
      </div>

      {/* Complete Leaderboard & Titles */}
      <div className="w-full glass-panel rounded-3xl p-3.5 border border-slate-800 flex-1 max-h-48 overflow-y-auto my-2 space-y-2">
        {players.map((p, idx) => {
          const badge = getPlayerTitle(p, idx);
          const isMe = p.id === currentPlayer.id;

          return (
            <div
              key={p.id}
              className={`flex items-center justify-between p-2.5 rounded-2xl border text-xs ${
                isMe
                  ? 'bg-amber-500/10 border-amber-500/40'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-black text-slate-400 w-4">#{idx + 1}</span>
                <span className="text-base">{p.avatar}</span>
                <div className="text-right">
                  <div className="font-extrabold text-white">
                    {p.nickname} {isMe && <span className="text-[10px] text-amber-400">(أنت)</span>}
                  </div>
                  <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded border inline-block mt-0.5 ${badge.color}`}>
                    {badge.title}
                  </div>
                </div>
              </div>

              <div className="font-mono font-black text-sm text-amber-400">
                {p.score} نقطة
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="w-full space-y-2 mt-2">
        {isHost ? (
          <button
            onClick={() => {
              playClickSound();
              onPlayAgain();
            }}
            className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-xl shadow-amber-500/25 hover:brightness-105 active:scale-98 transition-all"
          >
            <RotateCcw size={18} />
            <span>العبوا مرة ثانية (نفس الغرفة واللاعبين)</span>
          </button>
        ) : (
          <div className="text-xs text-slate-400 font-bold bg-slate-900 py-2.5 rounded-xl border border-slate-800">
            ⏳ بانتظار المضيف لاختيار "العبوا مرة ثانية"...
          </div>
        )}

        <button
          onClick={() => {
            playClickSound();
            onLeave();
          }}
          className="w-full py-3 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 active:scale-98 transition-all"
        >
          <Home size={16} />
          <span>العودة للرئيسية</span>
        </button>
      </div>
    </div>
  );
};

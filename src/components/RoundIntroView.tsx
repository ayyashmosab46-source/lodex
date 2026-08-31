import React, { useEffect, useState } from 'react';
import { RoomData, Player, MINI_GAME_INFO } from '../types/game';
import { playCountdownTick, playRoundStartSound } from '../utils/audio';
import { Sparkles, Trophy, UserCheck } from 'lucide-react';

interface RoundIntroViewProps {
  room: RoomData;
  currentPlayer: Player;
}

export const RoundIntroView: React.FC<RoundIntroViewProps> = ({ room, currentPlayer }) => {
  const [count, setCount] = useState(3);
  const miniGame = room.currentMiniGame!;
  const info = MINI_GAME_INFO[miniGame];
  const isSpecialRole = currentPlayer.role === 'artist';

  useEffect(() => {
    playCountdownTick();
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          playRoundStartSound();
          return 0;
        }
        playCountdownTick();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center animate-hit">
      {/* Round Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-black text-sm mb-4">
        <span>الجولة {room.currentRound} من {room.totalRounds}</span>
      </div>

      {/* Mini Game Icon & Title */}
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 border-2 border-amber-500/50 flex items-center justify-center text-5xl mb-4 shadow-2xl shadow-amber-500/20">
        {info.icon}
      </div>

      <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 font-['Cairo']">
        {info.nameAr}
      </h1>

      <p className="text-slate-300 text-sm sm:text-base font-semibold max-w-xs mb-6 leading-relaxed">
        {room.roundData?.description || info.descAr}
      </p>

      {/* Role Alert if Artist */}
      {isSpecialRole && (
        <div className="w-full glass-card p-4 rounded-2xl border-2 border-amber-400 bg-amber-500/10 mb-6 flex items-center justify-center gap-3">
          <span className="text-2xl">🎨</span>
          <div className="text-right">
            <div className="text-xs font-bold text-amber-300">دورك المميز هذه الجولة:</div>
            <div className="text-base font-black text-amber-400">
              أنت الرسام! ارسم الكلمة لفريقك بسرعة
            </div>
          </div>
        </div>
      )}

      {/* Big Animated Countdown */}
      <div className="relative flex items-center justify-center my-4">
        <div className="w-20 h-20 rounded-full bg-slate-900 border-4 border-amber-400 flex items-center justify-center font-black text-4xl text-amber-400 shadow-xl shadow-amber-500/30">
          {count > 0 ? count : 'انطلق!'}
        </div>
      </div>
    </div>
  );
};

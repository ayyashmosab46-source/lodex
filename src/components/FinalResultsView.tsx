import React, { useEffect } from 'react';
import { Trophy, Award, Crown, RotateCcw, Medal } from 'lucide-react';
import confetti from 'canvas-confetti';
import { RoomData, Player } from '../types/game';
import { soundManager } from '../utils/audio';

interface FinalResultsViewProps {
  room: RoomData;
  currentPlayer: Player;
  onPlayAgain?: () => void;
}

export const FinalResultsView: React.FC<FinalResultsViewProps> = ({
  room,
  currentPlayer,
  onPlayAgain,
}) => {
  const playersList: Player[] = (Object.values(room.players) as Player[]).sort((a, b) => b.score - a.score);

  const team1Score = playersList.filter((p) => p.team === 1).reduce((acc, p) => acc + p.score, 0);
  const team2Score = playersList.filter((p) => p.team === 2).reduce((acc, p) => acc + p.score, 0);

  const winnerTeam: 1 | 2 | 'tie' =
    team1Score > team2Score ? 1 : team2Score > team1Score ? 2 : 'tie';

  const isHost = currentPlayer.isHost;

  useEffect(() => {
    soundManager.playSuccess();
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  }, []);

  return (
    <div className="max-w-xl mx-auto px-4 py-8 flex flex-col items-center text-center">
      {/* Crown Badge */}
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center mb-4 shadow-2xl shadow-amber-500/40 animate-bounce-subtle">
        <Crown className="w-10 h-10 text-slate-950" />
      </div>

      <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">انتهت المباراة الكبرى! 🎉</h1>
      <p className="text-slate-400 text-sm mb-6">
        {winnerTeam === 'tie'
          ? 'تعادل مذهل وملحمي بين الفريقين!'
          : winnerTeam === 1
          ? 'الفريق الأزرق (1) هو بطل التحدي! 🏆'
          : 'الفريق الأحمر (2) هو بطل التحدي! 🏆'}
      </p>

      {/* Team Comparison Card */}
      <div className="grid grid-cols-2 gap-4 w-full mb-8">
        <div
          className={`rounded-3xl p-5 border-2 transition ${
            winnerTeam === 1
              ? 'bg-blue-950/80 border-blue-400 shadow-xl shadow-blue-500/20'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="font-bold text-blue-400 text-sm">الفريق الأزرق</span>
          </div>
          <p className="text-3xl font-black text-white font-mono">{team1Score}</p>
          <p className="text-[11px] text-slate-400 mt-1">مجموع النقاط</p>
        </div>

        <div
          className={`rounded-3xl p-5 border-2 transition ${
            winnerTeam === 2
              ? 'bg-rose-950/80 border-rose-400 shadow-xl shadow-rose-500/20'
              : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            <span className="font-bold text-rose-400 text-sm">الفريق الأحمر</span>
          </div>
          <p className="text-3xl font-black text-white font-mono">{team2Score}</p>
          <p className="text-[11px] text-slate-400 mt-1">مجموع النقاط</p>
        </div>
      </div>

      {/* Individual Leaderboard */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 mb-8 shadow-xl">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-center gap-1.5">
          <Medal className="w-4 h-4 text-amber-400" />
          لوحة صدارة اللاعبين
        </h3>

        <div className="space-y-2">
          {playersList.map((p, index) => (
            <div
              key={p.id}
              className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                index === 0
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-800 text-xs font-black flex items-center justify-center font-mono">
                  {index + 1}
                </span>
                <span className="text-xl">{p.avatar}</span>
                <div className="text-right">
                  <p className="text-xs font-bold text-white flex items-center gap-1">
                    {p.nickname}
                    {p.id === currentPlayer.id && <span className="text-amber-400 text-[10px]">(أنت)</span>}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {p.team === 1 ? 'الفريق الأزرق' : 'الفريق الأحمر'}
                  </p>
                </div>
              </div>
              <div className="text-left font-mono font-black text-amber-400 text-sm">
                {p.score} نقطة
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Play Again */}
      {isHost ? (
        <button
          onClick={onPlayAgain}
          className="w-full py-4 px-6 rounded-2xl font-black text-slate-950 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 shadow-xl shadow-amber-500/20 text-sm flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          بدء مباراة جديدة
        </button>
      ) : (
        <p className="text-xs text-slate-400 font-bold">بانتظار المضيف لبدء مباراة جديدة...</p>
      )}
    </div>
  );
};

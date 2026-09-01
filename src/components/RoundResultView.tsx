import React from 'react';
import { Trophy, CheckCircle, XCircle, Award, ArrowRight } from 'lucide-react';
import { RoomData, Player } from '../types/game';

interface RoundResultViewProps {
  room: RoomData;
  currentPlayer: Player;
  onNextRound?: () => void;
}

export const RoundResultView: React.FC<RoundResultViewProps> = ({
  room,
  currentPlayer,
  onNextRound,
}) => {
  const results = room.lastRoundResults;
  const isHost = currentPlayer.isHost;

  const winnerPlayer = results?.winnerPlayerId ? room.players[results.winnerPlayerId] : null;
  const isWinner = winnerPlayer?.id === currentPlayer.id;

  return (
    <div className="max-w-xl mx-auto px-4 py-8 flex flex-col items-center text-center">
      {/* Status Badge */}
      <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 shadow-xl">
        {results?.winnerPlayerId ? (
          <Trophy className="w-8 h-8 text-amber-400 animate-bounce-subtle" />
        ) : (
          <Award className="w-8 h-8 text-slate-400" />
        )}
      </div>

      <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
        {results?.winnerPlayerId
          ? isWinner
            ? 'أحسنت! إجابة مذهلة وسريعة 🎯'
            : `الفائز بهذه الجولة: ${winnerPlayer?.nickname} 👏`
          : 'انتهى وقت الجولة! ⌛'}
      </h2>

      {/* Correct Answer Card */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 my-6 shadow-xl">
        <p className="text-xs text-slate-400 font-bold mb-1">الإجابة الصحيحة هي:</p>
        <p className="text-2xl font-black text-amber-400 mb-3">{results?.correctAnswer || 'غير محدد'}</p>
        {results?.explanation && (
          <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-xs text-slate-300 leading-relaxed text-right">
            💡 {results.explanation}
          </div>
        )}
      </div>

      {/* Scores Summary */}
      <div className="grid grid-cols-2 gap-3 w-full mb-6">
        <div className="bg-blue-950/40 border border-blue-500/40 rounded-2xl p-4">
          <p className="text-xs text-blue-300 font-bold mb-1">الفريق الأزرق (1)</p>
          <p className="text-2xl font-black text-blue-400 font-mono">
            {results?.team1Score ?? 0} نقطة
          </p>
        </div>
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4">
          <p className="text-xs text-rose-300 font-bold mb-1">الفريق الأحمر (2)</p>
          <p className="text-2xl font-black text-rose-400 font-mono">
            {results?.team2Score ?? 0} نقطة
          </p>
        </div>
      </div>

      {/* Next Round Trigger */}
      {isHost ? (
        <button
          onClick={onNextRound}
          className="w-full py-3.5 px-6 rounded-2xl font-black text-slate-950 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 shadow-lg shadow-amber-500/20 text-sm flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <span>الجولة التالية</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      ) : (
        <p className="text-xs text-slate-400 font-bold">بانتظار المضيف للانتقال للجولة التالية...</p>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Copy, Check, Users, Crown, Play, Sparkles, CheckCircle2, Circle, AlertCircle, Share2 } from 'lucide-react';
import { RoomData, Player } from '../types/game';
import { playClickSound } from '../utils/audio';

interface LobbyViewProps {
  room: RoomData;
  currentPlayer: Player;
  onToggleReady: () => void;
  onSwitchTeam: () => void;
  onStartGame: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  room,
  currentPlayer,
  onToggleReady,
  onSwitchTeam,
  onStartGame,
}) => {
  const [copied, setCopied] = useState(false);
  const players = Object.values(room.players) as Player[];
  const connectedPlayers = players.filter((p) => p.isConnected);
  const isHost = currentPlayer.isHost;

  const team1Players = connectedPlayers.filter((p) => (p.team || 1) === 1);
  const team2Players = connectedPlayers.filter((p) => p.team === 2);

  const getShareUrl = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('room', room.code);
      return url.toString();
    } catch {
      return `${window.location.origin}/?room=${room.code}`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    playClickSound();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const shareUrl = getShareUrl();
    if (navigator.share) {
      navigator.share({
        title: 'العب لودكس معي!',
        text: `تعال العب معنا في لودكس! رمز الغرفة: ${room.code}`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      playClickSound();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canStart = connectedPlayers.length >= 1; // Allows 1+ for testing or full group
  const isStandardFull = connectedPlayers.length >= 3;

  return (
    <div className="w-full max-w-md mx-auto px-4 py-4 flex flex-col items-center justify-between min-h-[calc(100vh-70px)]">
      {/* Top Room Code Banner */}
      <div className="w-full glass-panel rounded-3xl p-4 sm:p-5 border border-slate-800 flex flex-col items-center text-center relative overflow-hidden shadow-xl mb-3">
        <div className="text-xs font-extrabold text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
          <Sparkles size={14} />
          <span>رمز الغرفة الخاص بك</span>
        </div>

        {/* Big Code */}
        <div className="flex items-center justify-center gap-3 my-1">
          <span className="font-mono text-4xl sm:text-5xl font-black text-white tracking-widest drop-shadow-md">
            {room.code}
          </span>
        </div>

        <p className="text-slate-400 text-xs font-semibold mb-2">
          شارك هذا الرمز مع أصدقائك لينضموا للغرفة
        </p>

        {/* Copy / Share Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-slate-200 active:scale-95 transition-all shadow-sm"
          >
            {copied ? (
              <>
                <Check size={15} className="text-emerald-400" />
                <span className="text-emerald-400">تم النسخ!</span>
              </>
            ) : (
              <>
                <Copy size={15} />
                <span>نسخ الرمز</span>
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-amber-400 active:scale-95 transition-all shadow-sm"
          >
            <Share2 size={15} />
            <span>مشاركة الرابط</span>
          </button>
        </div>
      </div>

      {/* Two Teams Overview */}
      <div className="w-full grid grid-cols-2 gap-2 mb-3">
        {/* Team 1 Box */}
        <div className="rounded-2xl p-2.5 bg-rose-950/30 border border-rose-800/40 flex flex-col">
          <div className="flex items-center justify-between mb-1 text-xs font-black text-rose-400">
            <span>🔴 الفريق الأول</span>
            <span className="text-[10px] bg-rose-900/60 px-1.5 py-0.5 rounded">{team1Players.length}</span>
          </div>
          <div className="flex -space-x-1 overflow-hidden py-1">
            {team1Players.map((p) => (
              <span key={p.id} title={p.nickname} className="w-6 h-6 rounded-full bg-slate-800 border border-rose-500 flex items-center justify-center text-xs">
                {p.avatar}
              </span>
            ))}
          </div>
        </div>

        {/* Team 2 Box */}
        <div className="rounded-2xl p-2.5 bg-cyan-950/30 border border-cyan-800/40 flex flex-col">
          <div className="flex items-center justify-between mb-1 text-xs font-black text-cyan-400">
            <span>🔵 الفريق الثاني</span>
            <span className="text-[10px] bg-cyan-900/60 px-1.5 py-0.5 rounded">{team2Players.length}</span>
          </div>
          <div className="flex -space-x-1 overflow-hidden py-1">
            {team2Players.map((p) => (
              <span key={p.id} title={p.nickname} className="w-6 h-6 rounded-full bg-slate-800 border border-cyan-500 flex items-center justify-center text-xs">
                {p.avatar}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Players List Card */}
      <div className="w-full glass-panel rounded-3xl p-4 border border-slate-800 flex-1 flex flex-col mb-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-amber-400" />
            <span className="font-black text-sm text-white">اللاعبون في الغرفة</span>
          </div>
          <button
            onClick={() => {
              playClickSound();
              onSwitchTeam();
            }}
            className="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-all"
          >
            تبديل الفريق 🔄
          </button>
        </div>

        {/* Player items grid */}
        <div className="space-y-2 flex-1 overflow-y-auto max-h-52 pr-1">
          {connectedPlayers.map((player) => {
            const isMe = player.id === currentPlayer.id;
            const isTeam1 = (player.team || 1) === 1;

            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                  isMe
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shadow-inner">
                    {player.avatar}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm text-white">
                        {player.nickname}
                      </span>
                      {isMe && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                          (أنت)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-bold">
                      <span className={isTeam1 ? 'text-rose-400' : 'text-cyan-400'}>
                        {isTeam1 ? 'الفريق الأول 🔴' : 'الفريق الثاني 🔵'}
                      </span>
                      {player.isHost && (
                        <span className="flex items-center gap-0.5 text-amber-400">
                          <Crown size={11} fill="currentColor" />
                          <span>مضيف</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ready Badge */}
                <div className="flex items-center gap-1.5">
                  {player.isReady ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-lg">
                      <CheckCircle2 size={12} />
                      <span>جاهز</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg">
                      <Circle size={12} />
                      <span>ينتظر</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Players notice */}
        <div className="mt-2 pt-2 border-t border-slate-800/80">
          {!isStandardFull ? (
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400/90 bg-amber-950/30 p-2 rounded-xl border border-amber-800/30">
              <AlertCircle size={14} className="shrink-0" />
              <span>المباراة تكون أكثر متعة عند وجود 3 لاعبين أو أكثر!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/30 p-2 rounded-xl border border-emerald-800/30">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>العدد ممتاز! يمكن للمضيف بدء اللعبة الآن.</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer Controls */}
      <div className="w-full space-y-2">
        {/* Toggle Ready for non-hosts */}
        {!isHost && (
          <button
            onClick={() => {
              playClickSound();
              onToggleReady();
            }}
            className={`w-full py-3 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all active:scale-98 shadow-lg ${
              currentPlayer.isReady
                ? 'bg-slate-900 border border-slate-700 text-slate-300'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            {currentPlayer.isReady ? (
              <>
                <CheckCircle2 size={18} />
                <span>إلغاء الجاهزية</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                <span>أنا جاهز للعب!</span>
              </>
            )}
          </button>
        )}

        {/* Start Game button for Host */}
        {isHost && (
          <button
            onClick={() => {
              playClickSound();
              onStartGame();
            }}
            disabled={!canStart}
            className="w-full py-3.5 rounded-2xl font-black text-base flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-xl shadow-amber-500/25 hover:brightness-105 active:scale-98 disabled:opacity-50 transition-all"
          >
            <Play size={20} fill="currentColor" />
            <span>ابدأ المباراة الآن (10 جولات)</span>
          </button>
        )}

        {!isHost && (
          <p className="text-center text-xs text-slate-400 font-semibold">
            بانتظار مضيف الغرفة لبدء المباراة...
          </p>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { Copy, Check, Play, Shield, Users, ArrowLeftRight, CheckCircle2, Circle } from 'lucide-react';
import { RoomData, Player } from '../types/game';

interface LobbyViewProps {
  room: RoomData;
  currentPlayer: Player;
  onToggleReady: () => void;
  onChangeTeam: (team: 1 | 2) => void;
  onStartGame: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  room,
  currentPlayer,
  onToggleReady,
  onChangeTeam,
  onStartGame,
}) => {
  const [copied, setCopied] = React.useState(false);

  const playersList: Player[] = Object.values(room.players) as Player[];
  const team1Players = playersList.filter((p) => p.team === 1);
  const team2Players = playersList.filter((p) => p.team === 2);

  const isHost = currentPlayer.isHost;
  const canStart = playersList.length >= 1; // Allows solo testing or party multiplayer

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Room Code Card */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-3xl p-5 mb-6 text-center">
        <p className="text-xs text-amber-400 font-bold mb-1">رمز الغرفة للمشاركة مع الأصدقاء</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-amber-300">
            {room.code}
          </span>
          <button
            onClick={handleCopyCode}
            className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition cursor-pointer"
            title="نسخ الرمز"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          شارك هذا الرمز مع أصدقائك لينضموا إليك من هواتفهم مباشرة!
        </p>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Team 1 */}
        <div className="bg-slate-900/90 border-2 border-blue-500/40 rounded-3xl p-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
              <h3 className="font-black text-blue-400 text-sm">الفريق الأزرق (1)</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono font-bold">
              {team1Players.length} لاعبين
            </span>
          </div>

          <div className="space-y-2 min-h-[120px]">
            {team1Players.map((p) => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border ${
                  p.id === currentPlayer.id
                    ? 'bg-blue-950/60 border-blue-500/60 text-white'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{p.avatar}</span>
                  <div>
                    <p className="text-xs font-bold flex items-center gap-1">
                      {p.nickname}
                      {p.isHost && <Shield className="w-3 h-3 text-amber-400 fill-amber-400" />}
                      {p.id === currentPlayer.id && (
                        <span className="text-[10px] text-blue-400">(أنت)</span>
                      )}
                    </p>
                  </div>
                </div>
                <div>
                  {p.isReady ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> جاهز
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Circle className="w-3.5 h-3.5" /> يستعد
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {currentPlayer.team !== 1 && (
            <button
              onClick={() => onChangeTeam(1)}
              className="w-full mt-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              الانتقال للفريق الأزرق
            </button>
          )}
        </div>

        {/* Team 2 */}
        <div className="bg-slate-900/90 border-2 border-rose-500/40 rounded-3xl p-4 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
              <h3 className="font-black text-rose-400 text-sm">الفريق الأحمر (2)</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono font-bold">
              {team2Players.length} لاعبين
            </span>
          </div>

          <div className="space-y-2 min-h-[120px]">
            {team2Players.map((p) => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border ${
                  p.id === currentPlayer.id
                    ? 'bg-rose-950/60 border-rose-500/60 text-white'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{p.avatar}</span>
                  <div>
                    <p className="text-xs font-bold flex items-center gap-1">
                      {p.nickname}
                      {p.isHost && <Shield className="w-3 h-3 text-amber-400 fill-amber-400" />}
                      {p.id === currentPlayer.id && (
                        <span className="text-[10px] text-rose-400">(أنت)</span>
                      )}
                    </p>
                  </div>
                </div>
                <div>
                  {p.isReady ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> جاهز
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Circle className="w-3.5 h-3.5" /> يستعد
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {currentPlayer.team !== 2 && (
            <button
              onClick={() => onChangeTeam(2)}
              className="w-full mt-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              الانتقال للفريق الأحمر
            </button>
          )}
        </div>
      </div>

      {/* Lobby Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row gap-3 items-center justify-between">
        <button
          onClick={onToggleReady}
          className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
            currentPlayer.isReady
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
          }`}
        >
          {currentPlayer.isReady ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              أنت جاهز الآن
            </>
          ) : (
            <>
              <Circle className="w-4 h-4" />
              اضغط لتأكيد الجاهزية
            </>
          )}
        </button>

        {isHost ? (
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl font-black text-slate-950 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 shadow-lg shadow-amber-500/20 text-sm flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            بدء التحدي والجولات
          </button>
        ) : (
          <div className="text-xs text-slate-400 text-center sm:text-right py-2">
            بانتظار مضيف الغرفة لبدء المباراة...
          </div>
        )}
      </div>
    </div>
  );
};

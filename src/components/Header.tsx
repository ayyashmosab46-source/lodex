import React, { useState } from 'react';
import { Volume2, VolumeX, LogOut, Copy, Check, Users, Sparkles } from 'lucide-react';
import { toggleAudio, isAudioEnabled, playClickSound } from '../utils/audio';
import { RoomData, Player } from '../types/game';

interface HeaderProps {
  room: RoomData | null;
  currentPlayer: Player | null;
  onLeaveRoom: () => void;
}

export const Header: React.FC<HeaderProps> = ({ room, currentPlayer, onLeaveRoom }) => {
  const [audioOn, setAudioOn] = useState(isAudioEnabled());
  const [copied, setCopied] = useState(false);

  const handleToggleSound = () => {
    const next = toggleAudio();
    setAudioOn(next);
    if (next) playClickSound();
  };

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    playClickSound();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full max-w-lg mx-auto px-4 py-3 flex items-center justify-between z-30 sticky top-0 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60">
      {/* Brand / Logo */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 p-[2px] shadow-lg shadow-amber-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-amber-400 text-lg">
            L
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-black text-xl tracking-tight text-white">لودكس</span>
            <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase bg-amber-500/10 px-1.5 py-0.5 rounded">LODEKS</span>
          </div>
        </div>
      </div>

      {/* Room and Status Info */}
      <div className="flex items-center gap-2">
        {room && (
          <>
            {/* Room Code Badge */}
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-200 active:scale-95 transition-all shadow-inner"
              title="نسخ رمز الغرفة"
            >
              <span className="text-slate-400">كود:</span>
              <span className="font-mono text-amber-400 tracking-wider font-extrabold">{room.code}</span>
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} className="text-slate-400" />}
            </button>

            {/* Round indicator if in game */}
            {room.state !== 'lobby' && (
              <div className="bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-300">
                {room.currentRound}/{room.totalRounds}
              </div>
            )}
          </>
        )}

        {/* Audio Toggle */}
        <button
          onClick={handleToggleSound}
          className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
          title={audioOn ? "كتم الصوت" : "تشغيل الصوت"}
        >
          {audioOn ? <Volume2 size={16} className="text-amber-400" /> : <VolumeX size={16} className="text-slate-500" />}
        </button>

        {/* Leave Room Button */}
        {room && (
          <button
            onClick={onLeaveRoom}
            className="w-8 h-8 rounded-lg bg-red-950/40 border border-red-800/40 flex items-center justify-center text-red-400 hover:bg-red-900/40 active:scale-95 transition-all"
            title="الخروج من الغرفة"
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </header>
  );
};

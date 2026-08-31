import React, { useState } from 'react';
import { PlusCircle, LogIn, Sparkles, Users, Trophy, Play, Zap } from 'lucide-react';
import { playClickSound } from '../utils/audio';

const AVATARS = ['🦁', '🦅', '🐪', '🚀', '👑', '⚡', '🍕', '🎮', '🏎️', '💎', '🔥', '🌟'];

interface HomeViewProps {
  onCreateRoom: (nickname: string, avatar: string) => void;
  onJoinRoom: (roomCode: string, nickname: string, avatar: string) => void;
  errorMessage?: string;
  isConnecting?: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onCreateRoom,
  onJoinRoom,
  errorMessage,
  isConnecting,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [nickname, setNickname] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    const cleanNick = nickname.trim() || 'لاعب لودكس';
    if (activeTab === 'create') {
      onCreateRoom(cleanNick, selectedAvatar);
    } else {
      if (!roomCode.trim()) return;
      onJoinRoom(roomCode.trim(), cleanNick, selectedAvatar);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-6 flex flex-col items-center justify-between min-h-[calc(100vh-70px)]">
      {/* Hero Brand Section */}
      <div className="w-full flex flex-col items-center text-center mt-2 mb-6">
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-indigo-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold mb-4 shadow-sm">
          <Sparkles size={14} className="animate-spin text-amber-400" />
          <span>منصة الألعاب الجماعية الأولى</span>
        </div>

        {/* Wordmark */}
        <div className="relative mb-2">
          <div className="text-6xl sm:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 drop-shadow-xl font-['Cairo']">
            لودكس
          </div>
          <div className="text-xs sm:text-sm font-extrabold tracking-widest text-amber-400 uppercase">
            L O D E K S
          </div>
        </div>

        <p className="text-slate-400 text-sm sm:text-base font-semibold max-w-xs mt-1">
          اجمع الشلة والعبوا 10 جولات حماسية وسريعة على الجوال!
        </p>

        {/* Quick Games Pills */}
        <div className="flex flex-wrap justify-center gap-1.5 mt-4 max-w-sm">
          <span className="text-[11px] font-bold bg-slate-900/90 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full">💡 الألغاز</span>
          <span className="text-[11px] font-bold bg-slate-900/90 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-full">🔊 وش الصوت؟</span>
          <span className="text-[11px] font-bold bg-slate-900/90 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full">🎬 وش صار؟</span>
          <span className="text-[11px] font-bold bg-slate-900/90 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full">🧩 ركّبها</span>
          <span className="text-[11px] font-bold bg-slate-900/90 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full">🎨 ارسم وخمّن</span>
          <span className="text-[11px] font-bold bg-slate-900/90 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-full">🕵️ مين أنا؟</span>
        </div>
      </div>

      {/* Main Interaction Card */}
      <div className="w-full glass-panel rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-800 relative overflow-hidden mb-6">
        {/* Glow accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Tabs Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setActiveTab('create');
            }}
            className={`py-2.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle size={17} />
            <span>إنشاء غرفة</span>
          </button>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setActiveTab('join');
            }}
            className={`py-2.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'join'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn size={17} />
            <span>انضمام لغرفة</span>
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-800/50 rounded-xl text-red-300 text-xs font-bold text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              اختر صورتك الرمزية:
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    setSelectedAvatar(emoji);
                  }}
                  className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center transition-all ${
                    selectedAvatar === emoji
                      ? 'bg-amber-500/20 border-2 border-amber-400 scale-105 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900/80 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Nickname Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              اسمك المستعار في اللعبة:
            </label>
            <input
              type="text"
              required
              maxLength={15}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="مثال: البطل، داحم، سارة..."
              className="w-full bg-slate-950/90 border border-slate-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-4 py-3 text-white placeholder-slate-500 font-bold text-sm outline-none transition-all text-right"
            />
          </div>

          {/* Room Code Input (for Join tab) */}
          {activeTab === 'join' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                رمز الغرفة (4 خانات):
              </label>
              <input
                type="text"
                required
                maxLength={4}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="مثال: LK72"
                className="w-full bg-slate-950/90 border border-slate-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 rounded-xl px-4 py-3 text-amber-400 placeholder-slate-600 font-mono font-black text-center text-lg tracking-widest uppercase outline-none transition-all"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isConnecting}
            className={`w-full py-3.5 rounded-xl font-black text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 disabled:opacity-50 ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 shadow-amber-500/25 hover:brightness-105'
                : 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-500 text-white shadow-indigo-500/25 hover:brightness-105'
            }`}
          >
            {isConnecting ? (
              <span>جاري الاتصال...</span>
            ) : activeTab === 'create' ? (
              <>
                <Play size={18} fill="currentColor" />
                <span>إنشاء غرفة جديدة</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>دخول الغرفة</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-slate-500 font-medium">
        <span>🎮 العب مع أصحابك من أي جوال مباشرة وبدون تسجيل</span>
      </div>
    </div>
  );
};

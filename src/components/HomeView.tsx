import React, { useState } from 'react';
import { Sparkles, Users, Play, Plus, LogIn, Swords, HelpCircle, Volume2, Film, Puzzle, Palette, UserCheck } from 'lucide-react';

interface HomeViewProps {
  onCreateRoom: (nickname: string, avatar: string) => void;
  onJoinRoom: (roomCode: string, nickname: string, avatar: string) => void;
  isConnecting: boolean;
  errorMessage?: string;
}

const AVATARS = ['🦁', '🦅', '🐺', '🦊', '🐯', '🐼', '🦄', '🐲', '🚀', '👑', '⚡', '🔥'];

export const HomeView: React.FC<HomeViewProps> = ({
  onCreateRoom,
  onJoinRoom,
  isConnecting,
  errorMessage,
}) => {
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦁');
  const [joinCode, setJoinCode] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    onCreateRoom(nickname.trim(), selectedAvatar);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !joinCode.trim()) return;
    onJoinRoom(joinCode.trim().toUpperCase(), nickname.trim(), selectedAvatar);
  };

  const miniGamesList = [
    { name: 'الألغاز والذكاء', icon: <HelpCircle className="w-4 h-4 text-emerald-400" />, desc: 'تحدي سرعة البديهة وحل الألغاز العميقة' },
    { name: 'وش الصوت؟', icon: <Volume2 className="w-4 h-4 text-amber-400" />, desc: 'استمع للتأثير الصوتي وخمّن المصدر أولاً' },
    { name: 'وش صار؟', icon: <Film className="w-4 h-4 text-purple-400" />, desc: 'تحدي الأحداث والمشاهد في أشهر المسلسلات' },
    { name: 'ركّبها', icon: <Puzzle className="w-4 h-4 text-blue-400" />, desc: 'اجمع 4 دلائل واكتشف الرابط السري' },
    { name: 'ارسم وخمّن', icon: <Palette className="w-4 h-4 text-pink-400" />, desc: 'رسم حي وفوري بين الفريقين وتخمين سريع' },
    { name: 'مين أنا؟', icon: <UserCheck className="w-4 h-4 text-cyan-400" />, desc: 'اكتشف الشخصية الغامضة مع التلميحات التدريجية' },
  ];

  return (
    <div className="max-w-xl mx-auto px-4 py-8 flex flex-col items-center">
      {/* Hero Badge */}
      <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 rounded-full text-amber-400 text-xs font-bold mb-6 animate-bounce-subtle">
        <Sparkles className="w-3.5 h-3.5" />
        <span>تحديات جماعية حماسية للأصدقاء والعائلة</span>
      </div>

      {/* Main Logo & Title */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 flex items-center justify-center font-black text-slate-950 text-4xl shadow-2xl shadow-amber-500/30 mb-3 transform hover:rotate-3 transition">
          ل
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          لـــودكــــس <span className="text-amber-400">| LODEKS</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
          تحدَّ أصدقاءك في 6 ألعاب مصغرة حماسية مباشرة بنظام الفرق والنقاط
        </p>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="w-full bg-red-950/80 border border-red-800/80 text-red-200 px-4 py-2.5 rounded-xl text-xs text-center mb-4">
          {errorMessage}
        </div>
      )}

      {/* Action Card */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md">
        {/* Nickname Input */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-300 mb-2">اسمك في اللعبة</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="مثال: البطل، القناص..."
            maxLength={15}
            className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none transition font-bold"
          />
        </div>

        {/* Avatar Selector */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-300 mb-2">اختر شخصيتك (الأفاتار)</label>
          <div className="grid grid-cols-6 gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
            {AVATARS.map((av) => (
              <button
                key={av}
                type="button"
                onClick={() => setSelectedAvatar(av)}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl text-xl sm:text-2xl flex items-center justify-center transition cursor-pointer ${
                  selectedAvatar === av
                    ? 'bg-amber-500 scale-110 shadow-lg shadow-amber-500/30'
                    : 'bg-slate-900 hover:bg-slate-800 opacity-70 hover:opacity-100'
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs: Create vs Join */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'create'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            إنشاء غرفة جديدة
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'join'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            الانضمام لغرفة
          </button>
        </div>

        {/* Form Actions */}
        {activeTab === 'create' ? (
          <form onSubmit={handleCreate}>
            <button
              type="submit"
              disabled={isConnecting || !nickname.trim()}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/20 text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isConnecting ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  إنشاء الغرفة وبدء التحدي
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="أدخل رمز الغرفة (مثال: ABCD)"
                maxLength={6}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-3 text-white text-center tracking-widest font-mono text-base uppercase placeholder-slate-500 outline-none transition font-bold"
              />
            </div>
            <button
              type="submit"
              disabled={isConnecting || !nickname.trim() || !joinCode.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white font-black py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/20 text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isConnecting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  دخول الغرفة
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Mini-Games Preview Grid */}
      <div className="w-full mt-10">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">
          الألعاب المصغرة المتضمنة في لودكس
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {miniGamesList.map((g, i) => (
            <div
              key={i}
              className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 flex flex-col items-center text-center hover:border-slate-700 transition"
            >
              <div className="p-2 rounded-xl bg-slate-950 mb-2">{g.icon}</div>
              <p className="text-xs font-bold text-slate-200">{g.name}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{g.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

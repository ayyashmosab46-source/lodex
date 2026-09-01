import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Send, Timer, Sparkles } from 'lucide-react';
import { Player } from '../../types/game';
import { soundManager } from '../../utils/audio';

interface SoundGuessGameProps {
  roundData: {
    title: string;
    soundKey: string;
    category: string;
  };
  currentPlayer: Player;
  roundTimeLeft: number;
  onSendAnswer: (answer: string) => void;
}

export const SoundGuessGame: React.FC<SoundGuessGameProps> = ({
  roundData,
  currentPlayer,
  roundTimeLeft,
  onSendAnswer,
}) => {
  const [inputAnswer, setInputAnswer] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const playSound = () => {
    setIsPlaying(true);
    soundManager.playSynthesizedSound(roundData.soundKey);
    setTimeout(() => setIsPlaying(false), 1500);
  };

  useEffect(() => {
    // Auto-play sound once when round starts
    const timer = setTimeout(() => {
      playSound();
    }, 500);
    return () => clearTimeout(timer);
  }, [roundData.soundKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAnswer.trim()) return;
    onSendAnswer(inputAnswer.trim());
    setInputAnswer('');
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 flex flex-col items-center">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between mb-4 bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
          <Volume2 className="w-4 h-4" />
          <span>وش الصوت؟ (تصنيف: {roundData.category})</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono font-bold text-amber-400 text-sm">
          <Timer className="w-4 h-4" />
          <span>{roundTimeLeft} ثانية</span>
        </div>
      </div>

      {/* Sound Speaker Card */}
      <div className="w-full bg-gradient-to-b from-amber-950/40 via-slate-900/90 to-slate-900/90 border border-amber-500/30 rounded-3xl p-8 shadow-2xl text-center mb-6 flex flex-col items-center">
        <button
          type="button"
          onClick={playSound}
          className={`w-28 h-28 rounded-3xl flex items-center justify-center transition-all transform cursor-pointer shadow-2xl ${
            isPlaying
              ? 'bg-amber-400 text-slate-950 scale-110 shadow-amber-500/50 animate-pulse'
              : 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 hover:scale-105 shadow-amber-500/30'
          }`}
        >
          <Volume2 className={`w-14 h-14 ${isPlaying ? 'animate-bounce-subtle' : ''}`} />
        </button>

        <h3 className="text-lg font-black text-white mt-5 mb-1">
          {isPlaying ? 'جاري تشغيل الصوت الآن...' : 'اضغط للاستماع مجدداً'}
        </h3>
        <p className="text-xs text-slate-400">
          استمع بدقة واكتب اسم الشيء أو الحيوان أو الأداة في الحقل أدناه
        </p>
      </div>

      {/* Answer Form */}
      <form onSubmit={handleSubmit} className="w-full flex gap-2">
        <input
          type="text"
          value={inputAnswer}
          onChange={(e) => setInputAnswer(e.target.value)}
          placeholder="ما هو هذا الصوت؟ (مثال: قطار، أسد، سيارة...)"
          className="flex-1 bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-2xl px-4 py-3.5 text-white placeholder-slate-500 text-sm outline-none font-bold transition"
          autoFocus
        />
        <button
          type="submit"
          disabled={!inputAnswer.trim()}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-amber-500/20"
        >
          <Send className="w-4 h-4" />
          <span>تخمين</span>
        </button>
      </form>
    </div>
  );
};

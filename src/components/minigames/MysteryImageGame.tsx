import React, { useState, useEffect } from 'react';
import { RoomData, Player } from '../../types/game';
import { ImageIllustration } from './ImageIllustrations';
import { Send, Eye, Clock, Sparkles } from 'lucide-react';
import { playClickSound } from '../../utils/audio';

interface MysteryImageGameProps {
  room: RoomData;
  currentPlayer: Player;
  onSubmitGuess: (text: string) => void;
}

export const MysteryImageGame: React.FC<MysteryImageGameProps> = ({
  room,
  currentPlayer,
  onSubmitGuess,
}) => {
  const [guessInput, setGuessInput] = useState('');
  const [revealProgress, setRevealProgress] = useState(0); // 0 to 1
  const [timeLeft, setTimeLeft] = useState(room.roundDuration);

  const q = room.roundData?.imageQuestion;

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Date.now() - room.roundStartTime;
      const total = room.roundDuration * 1000;
      const progress = Math.min(1, Math.max(0, elapsed / total));
      setRevealProgress(progress);

      const remaining = Math.max(0, Math.ceil((room.roundEndTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 150);

    return () => clearInterval(timer);
  }, [room.roundStartTime, room.roundEndTime, room.roundDuration]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim()) return;
    playClickSound();
    onSubmitGuess(guessInput.trim());
    setGuessInput('');
  };

  // Reveal math: starts zoomed 3.5x and blurs, unzooms to 1x and clears blur
  const scale = 3.2 - revealProgress * 2.2;
  const blurPx = Math.max(0, 16 * (1 - revealProgress));
  const spotlightRadius = 30 + revealProgress * 70; // percent

  return (
    <div className="w-full max-w-md mx-auto px-4 py-2 flex flex-col items-center justify-between min-h-[calc(100vh-80px)]">
      {/* Top Header */}
      <div className="w-full glass-panel rounded-2xl p-3 text-center border border-slate-800 shadow-md">
        <div className="flex items-center justify-between text-xs font-bold text-teal-400 mb-1">
          <div className="flex items-center gap-1">
            <Eye size={14} />
            <span>لعبة: الصورة الناقصة</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-amber-400">
            <Clock size={13} />
            <span>{timeLeft}s</span>
          </div>
        </div>
        <div className="text-sm font-extrabold text-white">
          {q?.title || 'الصورة تنكشف تدريجياً، خمّن وش هي!'}
        </div>
      </div>

      {/* Mystery Image Stage */}
      <div className="w-full my-3 flex flex-col items-center">
        <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-3xl bg-slate-900 border-2 border-teal-500/40 relative overflow-hidden shadow-2xl flex items-center justify-center">
          {/* Stylized Vector Image */}
          <div
            className="w-full h-full transition-all duration-300 transform flex items-center justify-center"
            style={{
              transform: `scale(${scale})`,
              filter: `blur(${blurPx}px)`,
              clipPath: `circle(${spotlightRadius}% at 50% 50%)`,
            }}
          >
            {q && <ImageIllustration name={q.svgName} />}
          </div>

          {/* Hint badge */}
          <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-sm border border-slate-800 py-1 px-2.5 rounded-xl text-center text-[11px] font-bold text-slate-300">
            💡 تلميح: {q?.hint}
          </div>
        </div>
      </div>

      {/* Live Chat Guesses Box */}
      <div className="w-full glass-panel rounded-2xl p-2.5 border border-slate-800 flex-1 max-h-32 overflow-y-auto mb-3 space-y-1.5 flex flex-col-reverse">
        {room.chatMessages.slice(-6).reverse().map((msg) => (
          <div
            key={msg.id}
            className={`text-xs px-2.5 py-1 rounded-lg flex items-center justify-between ${
              msg.isCorrect
                ? 'bg-emerald-950/80 border border-emerald-600 text-emerald-300 font-black'
                : 'bg-slate-900/60 text-slate-300 font-semibold'
            }`}
          >
            <span>
              <strong className="text-amber-400">{msg.nickname}:</strong> {msg.text}
            </span>
          </div>
        ))}
      </div>

      {/* Guess Input Field */}
      <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
        <input
          type="text"
          value={guessInput}
          disabled={currentPlayer.hasAnswered}
          onChange={(e) => setGuessInput(e.target.value)}
          placeholder={currentPlayer.hasAnswered ? 'أحسنت! إجابتك صحيحة' : 'اكتب تخمينك هنا واضغط إرسال...'}
          className="flex-1 bg-slate-900 border border-slate-700 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 rounded-xl px-4 py-3 text-white placeholder-slate-500 font-bold text-sm outline-none transition-all text-right disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!guessInput.trim() || currentPlayer.hasAnswered}
          className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:brightness-105 active:scale-95 disabled:opacity-40 text-slate-950 p-3 rounded-xl font-bold shadow-md shadow-teal-500/20"
        >
          <Send size={18} className="rotate-180" />
        </button>
      </form>
    </div>
  );
};

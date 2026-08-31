import React, { useState, useEffect } from 'react';
import { RoomData, Player } from '../../types/game';
import { Send, Puzzle, Clock, Sparkles } from 'lucide-react';
import { playClickSound } from '../../utils/audio';

interface CombineCluesGameProps {
  room: RoomData;
  currentPlayer: Player;
  onSubmitGuess: (text: string) => void;
}

export const CombineCluesGame: React.FC<CombineCluesGameProps> = ({
  room,
  currentPlayer,
  onSubmitGuess,
}) => {
  const [guessInput, setGuessInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(room.roundDuration);

  const q = room.roundData?.clueQuestion;

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((room.roundEndTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 200);

    return () => clearInterval(timer);
  }, [room.roundEndTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim()) return;
    playClickSound();
    onSubmitGuess(guessInput.trim());
    setGuessInput('');
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-2 flex flex-col items-center justify-between min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="w-full glass-panel rounded-2xl p-3 text-center border border-slate-800 shadow-md">
        <div className="flex items-center justify-between text-xs font-bold text-rose-400 mb-1">
          <div className="flex items-center gap-1">
            <Puzzle size={14} />
            <span>لعبة: ركّبها</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-amber-400">
            <Clock size={13} />
            <span>{timeLeft}s</span>
          </div>
        </div>
        <div className="text-sm font-black text-white">
          اجمع التلميحات واستنتج الكلمة المطلوبة!
        </div>
      </div>

      {/* Visual Clues Formula Display */}
      <div className="w-full my-4 flex flex-col items-center">
        <div className="w-full glass-card p-5 rounded-3xl border border-rose-500/30 flex flex-col items-center gap-4 shadow-xl">
          {/* Category Tag */}
          <div className="text-xs font-black px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
            التصنيف: {q?.category || 'عام'}
          </div>

          {/* Clues Row */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            {q?.clues.map((clue, idx) => (
              <React.Fragment key={idx}>
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-3xl sm:text-4xl shadow-inner animate-hit">
                  {clue}
                </div>
                {idx < q.clues.length - 1 && (
                  <span className="text-2xl font-black text-rose-400">+</span>
                )}
              </React.Fragment>
            ))}

            <span className="text-2xl font-black text-amber-400">=</span>

            {/* Answer target box */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 border-2 border-dashed border-amber-400 flex items-center justify-center text-2xl font-black text-amber-400">
              ؟
            </div>
          </div>

          {/* Hint */}
          <div className="text-xs text-slate-400 font-semibold text-center">
            💡 {q?.hint}
          </div>
        </div>
      </div>

      {/* Live Guess / Chat Log */}
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

      {/* Input Field */}
      <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
        <input
          type="text"
          value={guessInput}
          disabled={currentPlayer.hasAnswered}
          onChange={(e) => setGuessInput(e.target.value)}
          placeholder={currentPlayer.hasAnswered ? 'أحسنت! إجابتك صحيحة' : 'اكتب الكلمة واضغط إرسال...'}
          className="flex-1 bg-slate-900 border border-slate-700 focus:border-rose-400 focus:ring-1 focus:ring-rose-400 rounded-xl px-4 py-3 text-white placeholder-slate-500 font-bold text-sm outline-none transition-all text-right disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!guessInput.trim() || currentPlayer.hasAnswered}
          className="bg-gradient-to-r from-rose-500 to-pink-500 hover:brightness-105 active:scale-95 disabled:opacity-40 text-white p-3 rounded-xl font-bold shadow-md shadow-rose-500/20"
        >
          <Send size={18} className="rotate-180" />
        </button>
      </form>
    </div>
  );
};

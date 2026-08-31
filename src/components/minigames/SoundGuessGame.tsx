import React, { useState, useEffect } from 'react';
import { RoomData, Player } from '../../types/game';
import { playProceduralSound, playClickSound, playCorrectSound, playWrongSound } from '../../utils/audio';
import { Volume2, CheckCircle2, XCircle, Clock, Users } from 'lucide-react';

interface SoundGuessGameProps {
  room: RoomData;
  currentPlayer: Player;
  onAnswer: (index: number) => void;
}

const OPTION_LETTERS = ['أ', 'ب', 'ج', 'د'];

export const SoundGuessGame: React.FC<SoundGuessGameProps> = ({
  room,
  currentPlayer,
  onAnswer,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(room.roundDuration);

  const q = room.roundData?.soundQuestion;

  const playSound = () => {
    if (!q) return;
    setIsPlaying(true);
    playProceduralSound(q.soundType);
    setTimeout(() => setIsPlaying(false), 2200);
  };

  useEffect(() => {
    // Auto play sound once on mount
    playSound();
  }, [q?.soundType]);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((room.roundEndTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 200);

    return () => clearInterval(timer);
  }, [room.roundEndTime]);

  const handleSelect = (idx: number) => {
    if (selectedIdx !== null || currentPlayer.hasAnswered || !q) return;
    setSelectedIdx(idx);
    playClickSound();

    if (idx === q.correctIndex) {
      playCorrectSound();
    } else {
      playWrongSound();
    }

    onAnswer(idx);
  };

  const progressPercent = Math.max(0, Math.min(100, (timeLeft / room.roundDuration) * 100));
  const playerRecordedAnswer = room.roundData?.playerAnswers?.[currentPlayer.id];
  const activeAnswerIndex = selectedIdx !== null ? selectedIdx : playerRecordedAnswer?.answerIndex;
  const hasUserAnswered = currentPlayer.hasAnswered || selectedIdx !== null;

  const connectedPlayers = (Object.values(room.players) as Player[]).filter((p) => p.isConnected);
  const answeredCount = connectedPlayers.filter((p) => p.hasAnswered).length;

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-2 flex flex-col items-center justify-between min-h-[calc(100vh-80px)]" dir="rtl">
      {/* Header Banner - Zero Clues or Hints */}
      <div className="w-full glass-panel rounded-2xl p-4 text-center border border-purple-500/30 shadow-xl bg-gradient-to-b from-purple-950/40 to-slate-950">
        <div className="text-xs font-black text-purple-400 mb-1 flex items-center justify-center gap-1.5">
          <Volume2 size={15} />
          <span>لعبة: وش الصوت؟</span>
        </div>
        
        <h2 className="text-lg sm:text-xl font-black text-white">
          استمع للصوت جيداً وخمّن المصدر الصحيح
        </h2>

        {/* Timer Bar */}
        <div className="w-full bg-slate-950 h-2.5 rounded-full mt-3 overflow-hidden border border-slate-800 relative">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mt-1.5 px-1">
          <span className="flex items-center gap-1">
            <Clock size={12} className="text-purple-400" />
            <span>اعتمد على أذنك وسرعة تخمينك</span>
          </span>
          <span className="font-mono text-purple-300 font-bold">{timeLeft} ثانية</span>
        </div>
      </div>

      {/* Centerpiece: Pure Audio Player Button */}
      <div className="w-full flex-1 flex flex-col items-center justify-center my-4">
        <button
          id="btn-replay-sound"
          type="button"
          onClick={() => {
            playClickSound();
            playSound();
          }}
          className={`w-36 h-36 rounded-3xl flex flex-col items-center justify-center gap-2.5 border-2 transition-all shadow-2xl active:scale-95 ${
            isPlaying
              ? 'bg-purple-600/40 border-purple-400 shadow-purple-500/40 scale-105 ring-4 ring-purple-500/30 animate-pulse'
              : 'bg-slate-900/90 border-purple-500/50 hover:border-purple-400 hover:bg-slate-800/90 text-white shadow-purple-950/50'
          }`}
        >
          <Volume2 size={46} className={isPlaying ? 'text-amber-300 scale-110 transition-transform' : 'text-purple-400'} />
          <span className="text-xs font-black text-slate-100">
            {isPlaying ? 'جاري التشغيل 🔊...' : 'إعادة تشغيل الصوت 🔊'}
          </span>
        </button>
        <span className="text-[11px] font-bold text-slate-400 mt-2.5">
          اضغط الزر لإعادة الاستماع للصوت في أي وقت
        </span>
      </div>

      {/* 4 Multiple Choice Options */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
        {q?.options.map((optText, idx) => {
          const isSelectedByMe = activeAnswerIndex === idx;
          const isSingleCorrectAnswer = idx === q.correctIndex;

          let cardStyle = 'bg-slate-900/90 border-slate-700/80 text-white hover:border-purple-400 hover:bg-purple-950/30';
          let letterStyle = 'bg-slate-800 text-purple-300 border border-slate-700';

          if (hasUserAnswered) {
            if (isSingleCorrectAnswer) {
              cardStyle = 'bg-emerald-950/90 border-emerald-500 text-emerald-100 shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-500/50';
              letterStyle = 'bg-emerald-500 text-black font-black';
            } else if (isSelectedByMe && !isSingleCorrectAnswer) {
              cardStyle = 'bg-rose-950/90 border-rose-500 text-rose-100 shadow-lg shadow-rose-500/25 ring-2 ring-rose-500/50';
              letterStyle = 'bg-rose-500 text-white font-black';
            } else {
              cardStyle = 'bg-slate-900/40 border-slate-800/60 text-slate-500 opacity-50 cursor-not-allowed';
              letterStyle = 'bg-slate-800/60 text-slate-500 border-slate-800';
            }
          }

          return (
            <button
              key={idx}
              id={`btn-sound-option-${idx}`}
              onClick={() => handleSelect(idx)}
              disabled={hasUserAnswered}
              className={`p-3.5 sm:p-4 rounded-xl border-2 font-bold text-sm sm:text-base flex items-center justify-between transition-all active:scale-[0.98] ${cardStyle}`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${letterStyle}`}>
                  {OPTION_LETTERS[idx]}
                </span>
                <span>{optText}</span>
              </div>
              
              {hasUserAnswered && (
                <span>
                  {isSingleCorrectAnswer ? (
                    <CheckCircle2 size={20} className="text-emerald-400 animate-bounce" />
                  ) : isSelectedByMe ? (
                    <XCircle size={20} className="text-rose-400" />
                  ) : null}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Players Status Bar */}
      <div className="w-full glass-panel rounded-xl p-2.5 border border-slate-800/80 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <Users size={14} className="text-purple-400" />
          <span>المجيبون:</span>
          <span className="font-mono text-purple-300">{answeredCount} / {connectedPlayers.length}</span>
        </div>

        <div className="flex items-center -space-x-1.5 space-x-reverse">
          {connectedPlayers.map((p) => {
            const hasAns = p.hasAnswered;
            const pAnswer = room.roundData?.playerAnswers?.[p.id];
            return (
              <div
                key={p.id}
                title={`${p.nickname} ${hasAns ? '(أجاب)' : '(يستمع)'}`}
                className={`relative w-7 h-7 rounded-full flex items-center justify-center text-xs border-2 shadow-sm transition-transform ${
                  hasAns
                    ? pAnswer?.isCorrect
                      ? 'border-emerald-400 bg-emerald-950'
                      : 'border-rose-400 bg-rose-950'
                    : 'border-slate-700 bg-slate-800'
                }`}
              >
                <span>{p.avatar}</span>
                {hasAns && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-purple-400 border border-black" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, HelpCircle, CheckCircle2, XCircle, Clock, Lightbulb, UserSearch } from 'lucide-react';
import { RoomData, Player } from '../../types/game';
import { playClickSound, playCorrectSound, playWrongSound } from '../../utils/audio';

interface WhoAmIGameProps {
  room: RoomData;
  currentPlayer: Player;
  onAnswer: (optionIndex: number) => void;
}

export const WhoAmIGame: React.FC<WhoAmIGameProps> = ({ room, currentPlayer, onAnswer }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const q = room.roundData?.whoAmIQuestion;
  const revealedHints = room.roundData?.revealedHintsCount || 1;
  const playerAnswers = room.roundData?.playerAnswers || {};
  const myAnswer = playerAnswers[currentPlayer.id];
  const hasAnswered = currentPlayer.hasAnswered || selectedOption !== null;

  const handleSelectOption = (idx: number) => {
    if (hasAnswered || !q) return;
    playClickSound();
    setSelectedOption(idx);
    onAnswer(idx);

    if (idx === q.correctAnswer) {
      playCorrectSound();
    } else {
      playWrongSound();
    }
  };

  const getPointsBadge = (revealed: number) => {
    if (revealed === 1) return { text: '+100 نقطة (التلميح الأول)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    if (revealed === 2) return { text: '+75 نقطة (التلميح الثاني)', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    return { text: '+50 نقطة (التلميح الثالث)', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
  };

  const pointsBadge = getPointsBadge(revealedHints);

  if (!q) {
    return (
      <div className="flex items-center justify-center p-8 text-slate-400">
        <HelpCircle className="w-8 h-8 animate-spin ml-2 text-indigo-400" />
        <span>جاري تجهيز لغز مين أنا...</span>
      </div>
    );
  }

  return (
    <div id="who-am-i-container" className="w-full max-w-4xl mx-auto px-4 py-3 flex flex-col items-center gap-5">
      {/* Header Banner */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-2xl">
            🕵️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-wide">مين أنا؟</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {q.category}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              اقرأ التلميحات التدريجية وخمّن الشخصية/الشيء بأسرع وقت لجمع أعلى نقاط!
            </p>
          </div>
        </div>

        {/* Current Available Points Badge */}
        <div className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shadow-sm ${pointsBadge.color}`}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>{pointsBadge.text}</span>
        </div>
      </div>

      {/* 3 Progressive Hints Display */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3">
        {q.hints.map((hintText, index) => {
          const hintNumber = index + 1;
          const isRevealed = revealedHints >= hintNumber;
          const hintPts = hintNumber === 1 ? '100 نقطة' : hintNumber === 2 ? '75 نقطة' : '50 نقطة';

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative overflow-hidden rounded-2xl p-4 border transition-all duration-300 ${
                isRevealed
                  ? 'bg-slate-900/90 border-indigo-500/40 shadow-lg shadow-indigo-950/30'
                  : 'bg-slate-950/50 border-slate-800/60 opacity-50 backdrop-blur-sm'
              }`}
            >
              {/* Card Top Label */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isRevealed
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {hintNumber}
                  </div>
                  <span className="text-xs font-medium text-slate-300">
                    التلميح {hintNumber === 1 ? 'الأول' : hintNumber === 2 ? 'الثاني' : 'الثالث'}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {hintPts}
                </span>
              </div>

              {/* Card Body */}
              {isRevealed ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-sm font-medium text-slate-100 leading-relaxed flex items-start gap-2 pt-1"
                >
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{hintText}</span>
                </motion.div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 font-mono">
                  <Clock className="w-3.5 h-3.5 animate-spin text-slate-600" />
                  <span>يفتح بعد قليل...</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Answer Options Grid (4 Choices) */}
      <div className="w-full">
        <div className="text-xs font-semibold text-slate-400 mb-2 px-1 flex items-center justify-between">
          <span>اختر الإجابة الصحيحة:</span>
          {hasAnswered && (
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              تم تسجيل إجابتك، في انتظار باقي اللاعبين...
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {q.options.map((option, idx) => {
            const isSelectedByMe = selectedOption === idx || myAnswer?.answerIndex === idx;
            const isRevealedResult = hasAnswered && myAnswer;

            let buttonStyle = 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 text-slate-100 hover:border-slate-700';

            if (isSelectedByMe) {
              if (isRevealedResult) {
                buttonStyle = myAnswer.isCorrect
                  ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200 shadow-lg shadow-emerald-900/30'
                  : 'bg-rose-950/80 border-rose-500/80 text-rose-200 shadow-lg shadow-rose-900/30';
              } else {
                buttonStyle = 'bg-indigo-950/80 border-indigo-500/80 text-indigo-200 shadow-lg shadow-indigo-900/30';
              }
            } else if (hasAnswered) {
              buttonStyle = 'bg-slate-950/40 border-slate-900 text-slate-500 cursor-not-allowed';
            }

            return (
              <button
                key={idx}
                id={`who-am-i-option-${idx}`}
                onClick={() => handleSelectOption(idx)}
                disabled={hasAnswered}
                className={`w-full min-h-[58px] p-3.5 rounded-2xl border text-right font-medium text-sm sm:text-base transition-all duration-200 flex items-center justify-between gap-3 ${buttonStyle}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                      isSelectedByMe
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                    }`}
                  >
                    {idx === 0 ? 'أ' : idx === 1 ? 'ب' : idx === 2 ? 'ج' : 'د'}
                  </div>
                  <span className="font-semibold">{option}</span>
                </div>

                {isSelectedByMe && isRevealedResult && (
                  <div>
                    {myAnswer.isCorrect ? (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        +{myAnswer.points}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        خطأ
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Players Progress Strip */}
      <div className="w-full bg-slate-900/40 border border-slate-800/60 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
          <UserSearch className="w-3.5 h-3.5 text-indigo-400" />
          <span>حالة اللاعبين:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(Object.values(room.players) as Player[])
            .filter((p) => p.isConnected)
            .map((p) => {
              const ans = playerAnswers[p.id];
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs border transition-all ${
                    ans
                      ? 'bg-slate-800/90 border-slate-700 text-slate-200'
                      : 'bg-slate-950/40 border-slate-800/40 text-slate-500'
                  }`}
                >
                  <span>{p.avatar}</span>
                  <span className="font-medium">{p.nickname}</span>
                  {ans ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Clock className="w-3 h-3 text-slate-600 animate-pulse" />
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

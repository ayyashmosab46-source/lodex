import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Film, CheckCircle2, XCircle, Clock, Sparkles, HelpCircle } from 'lucide-react';
import { RoomData, Player } from '../../types/game';
import { SHOW_IMAGES } from '../../data/whatHappened';
import { playClickSound, playCorrectSound, playWrongSound } from '../../utils/audio';

interface WhatHappenedGameProps {
  room: RoomData;
  currentPlayer: Player;
  onAnswer: (index: number) => void;
}

const SHOW_THEMES: Record<string, { badge: string; border: string; glow: string }> = {
  'Breaking Bad': { badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40', border: 'border-emerald-500/30', glow: 'shadow-emerald-950/30' },
  'Dexter': { badge: 'bg-rose-950/80 text-rose-300 border-rose-500/40', border: 'border-rose-500/30', glow: 'shadow-rose-950/30' },
  'Prison Break': { badge: 'bg-amber-950/80 text-amber-300 border-amber-500/40', border: 'border-amber-500/30', glow: 'shadow-amber-950/30' },
  'Peaky Blinders': { badge: 'bg-stone-900/90 text-stone-200 border-stone-600/40', border: 'border-stone-500/30', glow: 'shadow-stone-950/30' },
  'Game of Thrones': { badge: 'bg-blue-950/80 text-blue-300 border-blue-500/40', border: 'border-blue-500/30', glow: 'shadow-blue-950/30' },
  'Squid Game': { badge: 'bg-pink-950/80 text-pink-300 border-pink-500/40', border: 'border-pink-500/30', glow: 'shadow-pink-950/30' },
  'Interstellar': { badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40', border: 'border-cyan-500/30', glow: 'shadow-cyan-950/30' },
};

export const WhatHappenedGame: React.FC<WhatHappenedGameProps> = ({
  room,
  currentPlayer,
  onAnswer,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const q = room.roundData?.whatHappenedQuestion;
  const playerAnswers = room.roundData?.playerAnswers || {};
  const myAnswer = playerAnswers[currentPlayer.id];
  const hasAnswered = currentPlayer.hasAnswered || selectedIdx !== null;

  const theme = q ? (SHOW_THEMES[q.showName] || SHOW_THEMES['Breaking Bad']) : SHOW_THEMES['Breaking Bad'];

  const handleSelect = (idx: number) => {
    if (hasAnswered || !q) return;
    setSelectedIdx(idx);
    playClickSound();

    if (idx === q.correctAnswer) {
      playCorrectSound();
    } else {
      playWrongSound();
    }

    onAnswer(idx);
  };

  if (!q) {
    return (
      <div className="flex items-center justify-center p-8 text-slate-400">
        <HelpCircle className="w-8 h-8 animate-spin ml-2 text-amber-400" />
        <span>جاري تجهيز سؤال وش صار...</span>
      </div>
    );
  }

  return (
    <div id="what-happened-container" className="w-full max-w-4xl mx-auto px-4 py-3 flex flex-col items-center gap-4">
      {/* Header Info */}
      <div className={`w-full flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border ${theme.border} rounded-2xl p-4 shadow-xl backdrop-blur-md`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-2xl">
            🎬
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-wide">وش صار؟</h2>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border ${theme.badge}`}>
                <Film className="w-3 h-3 inline-block ml-1" />
                {q.showNameAr}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              تذكر تفاصيل المشهد والعمل الفني واختر الإجابة الصحيحة بأسرع وقت!
            </p>
          </div>
        </div>

        <div className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border-amber-500/40">
          <Sparkles className="w-3.5 h-3.5" />
          <span>نقاط السرعة: 60 - 100 نقطة</span>
        </div>
      </div>

      {/* Main Question & Image Poster */}
      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
        {/* Left/Top: Visual Poster / Context */}
        <div className="md:col-span-5 flex flex-col justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg overflow-hidden relative">
          <div className="relative w-full aspect-video sm:aspect-4/3 rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 flex items-center justify-center">
            {
              <img
                src={q.imageUrl || SHOW_IMAGES[q.showName] || '/images/shows/breaking_bad.jpg'}
                alt={q.showNameAr}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            }
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-2.5 right-2.5 left-2.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-900/90 text-amber-300 border border-slate-700/60 shadow">
                {q.showNameAr}
              </span>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/50">
            <span className="text-slate-400 font-medium ml-1">سياق المشهد:</span>
            {q.sceneContext}
          </div>
        </div>

        {/* Right: Question and 4 Options */}
        <div className="md:col-span-7 flex flex-col justify-between gap-3 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-lg">
          {/* Question Text Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1.5">
              <span>السؤال:</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
              {q.question}
            </h3>
          </div>

          {/* 4 Choices */}
          <div className="grid grid-cols-1 gap-2.5">
            {q.options.map((option, idx) => {
              const isSelectedByMe = selectedIdx === idx || myAnswer?.answerIndex === idx;
              const isRevealedResult = hasAnswered && myAnswer;

              let buttonStyle = 'bg-slate-950/70 hover:bg-slate-800/90 border-slate-800 text-slate-100 hover:border-slate-700';

              if (isSelectedByMe) {
                if (isRevealedResult) {
                  buttonStyle = myAnswer.isCorrect
                    ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200 shadow-lg shadow-emerald-900/30'
                    : 'bg-rose-950/80 border-rose-500/80 text-rose-200 shadow-lg shadow-rose-900/30';
                } else {
                  buttonStyle = 'bg-amber-950/80 border-amber-500/80 text-amber-200 shadow-lg shadow-amber-900/30';
                }
              } else if (hasAnswered) {
                buttonStyle = 'bg-slate-950/30 border-slate-900 text-slate-500 cursor-not-allowed';
              }

              return (
                <button
                  key={idx}
                  id={`what-happened-option-${idx}`}
                  onClick={() => handleSelect(idx)}
                  disabled={hasAnswered}
                  className={`w-full p-3.5 rounded-xl border text-right font-medium text-sm transition-all duration-200 flex items-center justify-between gap-3 ${buttonStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSelectedByMe
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                      }`}
                    >
                      {idx === 0 ? 'أ' : idx === 1 ? 'ب' : idx === 2 ? 'ج' : 'د'}
                    </div>
                    <span className="font-semibold leading-snug">{option}</span>
                  </div>

                  {isSelectedByMe && isRevealedResult && (
                    <div>
                      {myAnswer.isCorrect ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          +{myAnswer.points}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
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
      </div>

      {/* Players status footer */}
      <div className="w-full bg-slate-900/40 border border-slate-800/60 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-medium text-slate-400">
          {hasAnswered ? (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              تم تسجيل إجابتك، ننتظر باقي اللاعبين...
            </span>
          ) : (
            <span>اختر إجابتك قبل انتهاء الوقت!</span>
          )}
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

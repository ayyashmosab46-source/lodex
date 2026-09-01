import React, { useEffect, useState } from 'react';
import { MiniGameType } from '../types/game';
import { HelpCircle, Volume2, Film, Puzzle, Palette, UserCheck, Timer } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface RoundIntroViewProps {
  miniGame: MiniGameType;
  currentRound: number;
  totalRounds: number;
  onFinishIntro?: () => void;
}

const GAME_META: Record<MiniGameType, { title: string; subtitle: string; icon: React.ReactNode; color: string; rules: string[] }> = {
  riddles: {
    title: 'تحدي الألغاز والذكاء',
    subtitle: 'لغز غامض يتطلب سرعة بديهة فائقة',
    icon: <HelpCircle className="w-12 h-12 text-emerald-400" />,
    color: 'from-emerald-500/20 to-emerald-950/40 border-emerald-500/40',
    rules: [
      'اقرأ اللغز بعناية مع فريقك',
      'لديك 30 ثانية للإجابة الصحيحة',
      'الفريق الأسرع في الإجابة يكسب 100 نقطة',
    ],
  },
  sound_guess: {
    title: 'وش الصوت؟',
    subtitle: 'استمع للتأثير الصوتي واكتشف مصدره فوراً',
    icon: <Volume2 className="w-12 h-12 text-amber-400" />,
    color: 'from-amber-500/20 to-amber-950/40 border-amber-500/40',
    rules: [
      'اضغط زر الاستماع لسماع المؤثر الصوتي',
      'خمّن ما هو الشيء أو الحيوان أو الوسيلة',
      'كل ثانية توفرها تزيد من نقاطك المكتسبة',
    ],
  },
  what_happened: {
    title: 'وش صار؟ (تحدي المشاهد)',
    subtitle: 'تذكر أحداث وتفاصيل أشهر المسلسلات والأفلام',
    icon: <Film className="w-12 h-12 text-purple-400" />,
    color: 'from-purple-500/20 to-purple-950/40 border-purple-500/40',
    rules: [
      'اقرأ الموقف الحرج من المسلسل أو الفيلم',
      'اختر الخيار الصحيح لما حدث تالياً في القصة',
      'الإجابة الصحيحة تمنح فريقك 100 نقطة',
    ],
  },
  combine_clues: {
    title: 'ركّبها (4 دلائل - كلمة واحدة)',
    subtitle: 'اجمع الدلائل الأربعة واكشف السر المشترك',
    icon: <Puzzle className="w-12 h-12 text-blue-400" />,
    color: 'from-blue-500/20 to-blue-950/40 border-blue-500/40',
    rules: [
      'ستظهر 4 بطاقات دلائل تقود لكلمة واحدة',
      'اكتب الإجابة باللغة العربية بدقة',
      'الأسرع في الاستنتاج يحصل على الجائزة الكبرى',
    ],
  },
  draw_guess: {
    title: 'ارسم وخمّن (مباشر)',
    subtitle: 'أحد اللاعبين يرسم والبقية يخمنون على الهواء!',
    icon: <Palette className="w-12 h-12 text-pink-400" />,
    color: 'from-pink-500/20 to-pink-950/40 border-pink-500/40',
    rules: [
      'الرسام المختار يرسم الكلمة على اللوحة',
      'بقية اللاعبين يخمنون في الدردشة الفورية',
      'الرسام والمخمن الأول يحصلان على نقاط إضافية',
    ],
  },
  who_am_i: {
    title: 'مين أنا؟ (الشخصية الغامضة)',
    subtitle: 'اكتشف الشخصية التاريخية أو الشهيرة مع 3 تلميحات تدريجية',
    icon: <UserCheck className="w-12 h-12 text-cyan-400" />,
    color: 'from-cyan-500/20 to-cyan-950/40 border-cyan-500/40',
    rules: [
      'التلميح 1 مفتوح (100 نقطة)',
      'التلميح 2 يفتح بعد 10 ثوانٍ (75 نقطة)',
      'التلميح 3 الأوضح بعد 20 ثانية (50 نقطة)',
    ],
  },
};

export const RoundIntroView: React.FC<RoundIntroViewProps> = ({
  miniGame,
  currentRound,
  totalRounds,
}) => {
  const [countdown, setCountdown] = useState(3);
  const meta = GAME_META[miniGame] || GAME_META.riddles;

  useEffect(() => {
    soundManager.playCountdown();
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        soundManager.playCountdown();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[70vh] text-center">
      {/* Round Indicator */}
      <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-1.5 rounded-full text-xs font-mono font-bold text-amber-400 mb-6">
        <span>الجولة {currentRound}</span>
        <span className="text-slate-600">/</span>
        <span className="text-slate-400">{totalRounds}</span>
      </div>

      {/* Game Card */}
      <div className={`w-full bg-gradient-to-b ${meta.color} border rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl mb-6 transform hover:scale-[1.01] transition`}>
        <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-950/80 border border-slate-800 flex items-center justify-center mb-4 shadow-lg">
          {meta.icon}
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">{meta.title}</h2>
        <p className="text-slate-300 text-sm mb-6 max-w-sm mx-auto">{meta.subtitle}</p>

        {/* Rules */}
        <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 text-right space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-center">قواعد الجولة:</p>
          {meta.rules.map((rule, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Countdown Timer */}
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-xl shadow-amber-500/30 animate-pulse">
          {countdown > 0 ? countdown : 'انطلق!'}
        </div>
        <p className="text-xs text-slate-400 font-bold mt-2">ستبدأ الجولة خلال ثوانٍ...</p>
      </div>
    </div>
  );
};

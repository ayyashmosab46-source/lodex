import React, { useState, useEffect, useRef } from 'react';
import { RoomData, Player } from '../../types/game';
import { Send, Lightbulb, Clock, Users, ArrowLeftRight, HelpCircle, ShieldAlert } from 'lucide-react';
import { playClickSound, playTurnSwitchSound, playWrongSound } from '../../utils/audio';

interface RiddlesGameProps {
  room: RoomData;
  currentPlayer: Player;
  onSubmitGuess: (text: string) => void;
}

export const RiddlesGame: React.FC<RiddlesGameProps> = ({
  room,
  currentPlayer,
  onSubmitGuess,
}) => {
  const [guessInput, setGuessInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const prevActiveTeamRef = useRef<number | undefined>(room.roundData?.activeTeam);

  const rd = room.roundData;
  const q = rd?.riddleQuestion;
  const activeTeam = rd?.activeTeam ?? 1;
  const isMyTeamTurn = currentPlayer.team === activeTeam;

  const allPlayers = Object.values(room.players) as Player[];
  const team1Players = allPlayers.filter((p) => p.team === 1 && p.isConnected);
  const team2Players = allPlayers.filter((p) => p.team === 2 && p.isConnected);

  const team1Time = rd?.team1TimeLeft ?? 30;
  const team2Time = rd?.team2TimeLeft ?? 30;

  const formatTime = (seconds: number) => {
    const s = Math.max(0, seconds);
    return `0:${s < 10 ? '0' : ''}${s}`;
  };

  // Detect turn switch and play cue
  useEffect(() => {
    if (prevActiveTeamRef.current !== undefined && prevActiveTeamRef.current !== activeTeam) {
      playTurnSwitchSound();
    }
    prevActiveTeamRef.current = activeTeam;
  }, [activeTeam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim() || !isMyTeamTurn) return;
    playClickSound();
    onSubmitGuess(guessInput.trim());
    setGuessInput('');
  };

  return (
    <div className="w-full max-w-md mx-auto px-3 py-2 flex flex-col items-center justify-between min-h-[calc(100vh-80px)]" dir="rtl">
      {/* Top Two-Team HUD */}
      <div className="w-full grid grid-cols-2 gap-2 mb-2">
        {/* Team 1 Card */}
        <div
          className={`rounded-2xl p-2.5 border transition-all duration-300 ${
            activeTeam === 1
              ? 'bg-rose-500/20 border-rose-500 shadow-lg shadow-rose-500/20 ring-2 ring-rose-400'
              : 'bg-slate-900/80 border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 font-black text-xs text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span>الفريق الأول 🔴</span>
              {currentPlayer.team === 1 && (
                <span className="text-[10px] bg-rose-500/30 text-rose-200 px-1 py-0.2 rounded font-bold">
                  (فريقك)
                </span>
              )}
            </div>
            {activeTeam === 1 && (
              <span className="text-[10px] font-black uppercase text-rose-300 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-800/80 animate-pulse">
                دورهم 🎯
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-1">
            {/* Team Members Avatars */}
            <div className="flex -space-x-1 overflow-hidden">
              {team1Players.map((p) => (
                <div
                  key={p.id}
                  title={p.nickname}
                  className="w-6 h-6 rounded-full bg-slate-800 border border-rose-400/50 flex items-center justify-center text-xs shadow"
                >
                  {p.avatar}
                </div>
              ))}
            </div>

            {/* Timer */}
            <div className="flex items-center gap-1 font-mono font-black text-base text-rose-400">
              <Clock size={14} className={activeTeam === 1 ? 'animate-spin' : ''} />
              <span>الفريق الأول — {formatTime(team1Time)}</span>
            </div>
          </div>
        </div>

        {/* Team 2 Card */}
        <div
          className={`rounded-2xl p-2.5 border transition-all duration-300 ${
            activeTeam === 2
              ? 'bg-cyan-500/20 border-cyan-500 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400'
              : 'bg-slate-900/80 border-slate-800 opacity-60'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 font-black text-xs text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
              <span>الفريق الثاني 🔵</span>
              {currentPlayer.team === 2 && (
                <span className="text-[10px] bg-cyan-500/30 text-cyan-200 px-1 py-0.2 rounded font-bold">
                  (فريقك)
                </span>
              )}
            </div>
            {activeTeam === 2 && (
              <span className="text-[10px] font-black uppercase text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/80 animate-pulse">
                دورهم 🎯
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-1">
            {/* Team Members Avatars */}
            <div className="flex -space-x-1 overflow-hidden">
              {team2Players.map((p) => (
                <div
                  key={p.id}
                  title={p.nickname}
                  className="w-6 h-6 rounded-full bg-slate-800 border border-cyan-400/50 flex items-center justify-center text-xs shadow"
                >
                  {p.avatar}
                </div>
              ))}
            </div>

            {/* Timer */}
            <div className="flex items-center gap-1 font-mono font-black text-base text-cyan-400">
              <Clock size={14} className={activeTeam === 2 ? 'animate-spin' : ''} />
              <span>الفريق الثاني — {formatTime(team2Time)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Turn Banner Status */}
      <div
        className={`w-full py-2 px-3 rounded-xl text-center text-xs font-black mb-2 flex items-center justify-center gap-2 border shadow-sm transition-all ${
          isMyTeamTurn
            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 animate-pulse'
            : 'bg-slate-900/90 border-slate-800 text-slate-400'
        }`}
      >
        {activeTeam === 2 && team1Time === 0 ? (
          <span className="text-amber-300 font-bold">
            ⌛ انتهى وقت الفريق الأول! الآن دور الفريق الثاني
          </span>
        ) : isMyTeamTurn ? (
          <>
            <span className="text-base">⚡</span>
            <span>دور فريقكم الآن! اكتبوا الحل الصحيح قبل انتهاء وقتكم ({formatTime(currentPlayer.team === 1 ? team1Time : team2Time)})</span>
          </>
        ) : (
          <>
            <ArrowLeftRight size={14} className="text-slate-400" />
            <span>دور الفريق الخصم الآن... ترقبوا خطأهم لينتقل اللغز إليكم!</span>
          </>
        )}
      </div>

      {/* Main Riddle Card */}
      <div className="w-full glass-panel rounded-3xl p-4 sm:p-5 border border-amber-500/30 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-950/90 shadow-2xl relative flex flex-col items-center text-center my-1">
        {/* Category Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-extrabold text-xs mb-3">
          <Lightbulb size={14} />
          <span>لغز: {q?.category || 'ذكاء وتفكير'}</span>
        </div>

        {/* Riddle Text */}
        <h2 className="text-lg sm:text-xl font-black text-white leading-relaxed font-['Cairo'] my-2">
          {q?.riddle || 'جاري تحميل اللغز...'}
        </h2>

        {/* Hint button/disclosure */}
        {q?.hint && (
          <div className="mt-3 w-full">
            {showHint ? (
              <div className="bg-amber-950/40 border border-amber-500/40 py-2 px-3 rounded-xl text-xs font-bold text-amber-300 animate-hit">
                💡 تلميح: {q.hint}
              </div>
            ) : (
              <button
                onClick={() => {
                  playClickSound();
                  setShowHint(true);
                }}
                className="text-xs font-bold text-slate-400 hover:text-amber-300 flex items-center justify-center gap-1 mx-auto py-1 px-3 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all"
              >
                <HelpCircle size={13} />
                <span>إظهار التلميح</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Live Chat / Guesses List */}
      <div className="w-full glass-panel rounded-2xl p-2.5 border border-slate-800 flex-1 max-h-32 overflow-y-auto my-2 space-y-1.5 flex flex-col-reverse">
        {room.chatMessages.slice(-6).reverse().map((msg) => (
          <div
            key={msg.id}
            className={`text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
              msg.isSystem
                ? 'bg-rose-950/60 border border-rose-800/80 text-rose-300 font-black animate-shake'
                : msg.isCorrect
                ? 'bg-emerald-950/80 border border-emerald-600 text-emerald-300 font-black'
                : 'bg-slate-900/60 text-slate-300 font-semibold'
            }`}
          >
            <span>
              {!msg.isSystem && <strong className="text-amber-400">{msg.nickname}: </strong>}
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      {/* Answer Submission Form */}
      <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
        <input
          type="text"
          value={guessInput}
          disabled={!isMyTeamTurn}
          onChange={(e) => setGuessInput(e.target.value)}
          placeholder={
            isMyTeamTurn
              ? 'اكتب حل اللغز واضغط إرسال لفريقك...'
              : '⏳ انتظر دور فريقك لإرسال الحل...'
          }
          className={`flex-1 rounded-xl px-4 py-3 font-bold text-sm outline-none transition-all text-right ${
            isMyTeamTurn
              ? 'bg-slate-900 border-2 border-amber-500/70 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white placeholder-slate-400'
              : 'bg-slate-950/80 border border-slate-800 text-slate-500 placeholder-slate-600 cursor-not-allowed'
          }`}
        />
        <button
          type="submit"
          disabled={!guessInput.trim() || !isMyTeamTurn}
          className={`p-3 rounded-xl font-black shadow-md transition-all active:scale-95 flex items-center justify-center ${
            isMyTeamTurn && guessInput.trim()
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:brightness-105 shadow-amber-500/20'
              : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
          }`}
        >
          <Send size={18} className="rotate-180" />
        </button>
      </form>
    </div>
  );
};

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RoomData, Player, DrawStroke, DrawPoint } from '../../types/game';
import { Palette, Eraser, RotateCcw, Send, Clock, Paintbrush, Sparkles, CheckCircle2, ShieldAlert, Users } from 'lucide-react';
import { playClickSound } from '../../utils/audio';

const COLORS = ['#ffffff', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#000000'];
const BRUSH_SIZES = [3, 6, 12];

interface DrawAndGuessGameProps {
  room: RoomData;
  currentPlayer: Player;
  onSendStroke: (stroke: DrawStroke) => void;
  onClearCanvas: () => void;
  onUndoStroke: () => void;
  onSubmitGuess: (text: string) => void;
}

export const DrawAndGuessGame: React.FC<DrawAndGuessGameProps> = ({
  room,
  currentPlayer,
  onSendStroke,
  onClearCanvas,
  onUndoStroke,
  onSubmitGuess,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const rd = room.roundData;
  const activeTeam = rd?.activeTeam || 1;
  const activeArtistId = rd?.activePlayerId;
  const isCurrentArtist = currentPlayer.id === activeArtistId;
  const isMyTeamActive = currentPlayer.team === activeTeam;
  const secretWord = rd?.drawWord;

  const team1AttemptUsed = Boolean(rd?.team1AttemptUsed);
  const team2AttemptUsed = Boolean(rd?.team2AttemptUsed);
  const myTeamAttemptUsed = currentPlayer.team === 1 ? team1AttemptUsed : team2AttemptUsed;
  const activeTeamAttemptUsed = activeTeam === 1 ? team1AttemptUsed : team2AttemptUsed;

  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedSize, setSelectedSize] = useState(BRUSH_SIZES[1]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStrokePoints, setCurrentStrokePoints] = useState<DrawPoint[]>([]);
  const [guessInput, setGuessInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(room.roundDuration);

  // Redraw all strokes whenever room.drawingStrokes changes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a'; // dark slate canvas background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all strokes
    room.drawingStrokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(stroke.points[0].x * canvas.width, stroke.points[0].y * canvas.height);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * canvas.width, stroke.points[i].y * canvas.height);
      }
      ctx.stroke();
    });
  }, [room.drawingStrokes]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((room.roundEndTime - Date.now()) / 1000));
      setTimeLeft(remaining);
    }, 200);

    return () => clearInterval(timer);
  }, [room.roundEndTime]);

  // Touch & Mouse Drawing Handlers for Artist
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): DrawPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    return { x, y };
  };

  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isCurrentArtist) return;
    const pt = getCanvasCoords(e);
    if (!pt) return;

    setIsDrawing(true);
    setCurrentStrokePoints([pt]);
  };

  const handleMoveDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isCurrentArtist || !isDrawing) return;
    const pt = getCanvasCoords(e);
    if (!pt) return;

    const newPoints = [...currentStrokePoints, pt];
    setCurrentStrokePoints(newPoints);

    // Live preview on local canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx && newPoints.length >= 2) {
        ctx.beginPath();
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = selectedSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const prev = newPoints[newPoints.length - 2];
        ctx.moveTo(prev.x * canvas.width, prev.y * canvas.height);
        ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
        ctx.stroke();
      }
    }
  };

  const handleEndDraw = () => {
    if (!isCurrentArtist || !isDrawing) return;
    setIsDrawing(false);

    if (currentStrokePoints.length >= 2) {
      const stroke: DrawStroke = {
        points: currentStrokePoints,
        color: selectedColor,
        size: selectedSize,
      };
      onSendStroke(stroke);
    }
    setCurrentStrokePoints([]);
  };

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim() || isCurrentArtist || !isMyTeamActive || myTeamAttemptUsed) return;
    playClickSound();
    onSubmitGuess(guessInput.trim());
    setGuessInput('');
  };

  const team1Artist = rd?.team1ArtistId ? room.players[rd.team1ArtistId] : null;
  const team2Artist = rd?.team2ArtistId ? room.players[rd.team2ArtistId] : null;
  const currentArtistPlayer = activeArtistId ? room.players[activeArtistId] : null;

  return (
    <div className="w-full max-w-md mx-auto px-4 py-2 flex flex-col items-center justify-between min-h-[calc(100vh-80px)]" dir="rtl">
      {/* Header Banner with Team Turn Indicators */}
      <div className="w-full glass-panel rounded-2xl p-3.5 text-center border border-slate-800 shadow-md">
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <div className="flex items-center gap-1 text-cyan-400">
            <Paintbrush size={14} />
            <span>تحدي الفرق: ارسم وخمّن</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-amber-400">
            <Clock size={13} />
            <span>{timeLeft}s</span>
          </div>
        </div>

        {/* Teams Status Pill */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* Team 1 */}
          <div
            className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-0.5 transition-all ${
              activeTeam === 1
                ? 'bg-red-950/80 border-red-500 text-red-200 shadow-lg shadow-red-500/20 ring-1 ring-red-500/50'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 opacity-60'
            }`}
          >
            <div className="flex items-center gap-1 font-black">
              <span>🔴 الفريق الأول</span>
              {activeTeam === 1 && <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />}
            </div>
            <span className="text-[10px] text-slate-300">
              الرسام: {team1Artist?.nickname || 'غير محدد'}
            </span>
            <span className="text-[10px] text-amber-400 font-mono">
              {team1AttemptUsed ? '❌ استنفذ المحاولة' : '⚡ لديه محاولة 1'}
            </span>
          </div>

          {/* Team 2 */}
          <div
            className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-0.5 transition-all ${
              activeTeam === 2
                ? 'bg-blue-950/80 border-blue-500 text-blue-200 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500/50'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 opacity-60'
            }`}
          >
            <div className="flex items-center gap-1 font-black">
              <span>🔵 الفريق الثاني</span>
              {activeTeam === 2 && <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />}
            </div>
            <span className="text-[10px] text-slate-300">
              الرسام: {team2Artist?.nickname || 'غير محدد'}
            </span>
            <span className="text-[10px] text-amber-400 font-mono">
              {team2AttemptUsed ? '❌ استنفذ المحاولة' : '⚡ لديه محاولة 1'}
            </span>
          </div>
        </div>

        {/* Role Notice */}
        {isCurrentArtist ? (
          <div className="bg-amber-500/15 border border-amber-500/40 rounded-xl p-2 flex items-center justify-center gap-2">
            <span className="text-xs text-amber-300 font-bold">الكلمة السرية المطلوب رسمها:</span>
            <span className="text-base font-black text-amber-400 bg-slate-950 px-3 py-0.5 rounded-lg border border-amber-500/50">
              {secretWord}
            </span>
          </div>
        ) : isMyTeamActive ? (
          <div className="text-xs sm:text-sm font-extrabold text-cyan-300 mt-1">
            ⚡ دور فريقك الآن! الرسام <span className="text-white">({currentArtistPlayer?.nickname})</span> يرسم... خمّن الكلمة (محاولة واحدة فقط)!
          </div>
        ) : (
          <div className="text-xs font-bold text-slate-400 mt-1">
            ⏳ دور {activeTeam === 1 ? 'الفريق الأول 🔴' : 'الفريق الثاني 🔵'} الآن... استعد لدور فريقك!
          </div>
        )}
      </div>

      {/* Canvas Area */}
      <div className="w-full my-2 flex flex-col items-center">
        <div className="w-full aspect-[4/3] max-w-xs sm:max-w-sm rounded-3xl bg-slate-900 border-2 border-cyan-500/40 shadow-2xl relative overflow-hidden">
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            onMouseDown={handleStartDraw}
            onMouseMove={handleMoveDraw}
            onMouseUp={handleEndDraw}
            onMouseLeave={handleEndDraw}
            onTouchStart={handleStartDraw}
            onTouchMove={handleMoveDraw}
            onTouchEnd={handleEndDraw}
            className={`w-full h-full block ${isCurrentArtist ? 'cursor-crosshair' : 'cursor-default pointer-events-none'}`}
          />
        </div>

        {/* Artist Drawing Controls Toolbar */}
        {isCurrentArtist && (
          <div className="w-full glass-panel rounded-2xl p-2.5 mt-2 border border-slate-800 flex items-center justify-between gap-2">
            {/* Color Palette */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    selectedColor === c ? 'scale-110 border-white shadow-md' : 'border-transparent opacity-80'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Undo & Clear */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onUndoStroke}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95"
                title="تراجع"
              >
                <RotateCcw size={16} />
              </button>
              <button
                type="button"
                onClick={onClearCanvas}
                className="p-2 rounded-xl bg-red-950/60 border border-red-800/60 hover:bg-red-900/60 text-red-300 active:scale-95"
                title="مسح اللوحة"
              >
                <Eraser size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Guesses / Chat Section */}
      {!isCurrentArtist ? (
        <div className="w-full flex flex-col gap-2">
          {/* Live Chat Guesses Box */}
          <div className="w-full glass-panel rounded-2xl p-2.5 border border-slate-800 max-h-24 overflow-y-auto space-y-1 flex flex-col-reverse">
            {room.chatMessages.slice(-5).reverse().map((msg) => (
              <div
                key={msg.id}
                className={`text-xs px-2.5 py-1 rounded-lg flex items-center justify-between ${
                  msg.isCorrect
                    ? 'bg-emerald-950/80 border border-emerald-600 text-emerald-300 font-black'
                    : msg.isSystem
                    ? 'bg-amber-950/60 border border-amber-700/50 text-amber-300 font-bold'
                    : 'bg-slate-900/60 text-slate-300 font-semibold'
                }`}
              >
                <span>
                  <strong className={msg.isSystem ? 'text-amber-400' : 'text-cyan-400'}>{msg.nickname}:</strong> {msg.text}
                </span>
              </div>
            ))}
          </div>

          {/* Guess Input Field */}
          {isMyTeamActive ? (
            myTeamAttemptUsed ? (
              <div className="w-full p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center text-xs font-bold text-amber-400 flex items-center justify-center gap-1.5">
                <CheckCircle2 size={16} />
                <span>تم إرسال محاولة فريقك! في انتظار النتيجة...</span>
              </div>
            ) : (
              <form onSubmit={handleGuessSubmit} className="w-full flex items-center gap-2">
                <input
                  type="text"
                  value={guessInput}
                  disabled={myTeamAttemptUsed}
                  onChange={(e) => setGuessInput(e.target.value)}
                  placeholder="خمّن الكلمة (لديك محاولة واحدة فقط)..."
                  className="flex-1 bg-slate-900 border border-cyan-500/50 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-4 py-3 text-white placeholder-slate-500 font-bold text-sm outline-none transition-all text-right"
                />
                <button
                  type="submit"
                  disabled={!guessInput.trim() || myTeamAttemptUsed}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:brightness-105 active:scale-95 disabled:opacity-40 text-slate-950 p-3 rounded-xl font-bold shadow-md shadow-cyan-500/20"
                >
                  <Send size={18} className="rotate-180" />
                </button>
              </form>
            )
          ) : (
            <div className="w-full p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldAlert size={15} />
              <span>دور الفريق الآخر حالياً... خانة التخمين ستفتح لفريقك فور انتقال الفرصة!</span>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full text-center py-2.5 text-xs font-bold text-amber-400/90 bg-amber-950/20 rounded-xl border border-amber-800/30">
          🎨 ارسم بوضوح وسرعة لزميلك في الفريق ليخمّن وتحصلا معاً على النقاط (+100 للمخمّن و+80 للرسام)!
        </div>
      )}
    </div>
  );
};

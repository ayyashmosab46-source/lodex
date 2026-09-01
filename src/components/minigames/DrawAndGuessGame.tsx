import React, { useRef, useState, useEffect } from 'react';
import { Palette, Eraser, Trash2, Send, Timer, Sparkles } from 'lucide-react';
import { Player, DrawingStroke, DrawingPoint, ChatMessage } from '../../types/game';

interface DrawAndGuessGameProps {
  roundData: {
    drawerId: string;
    drawerNickname: string;
    wordToDraw?: string;
    category?: string;
  };
  currentPlayer: Player;
  roundTimeLeft: number;
  drawingStrokes: DrawingStroke[];
  chatMessages: ChatMessage[];
  onDrawStroke: (stroke: DrawingStroke) => void;
  onClearCanvas: () => void;
  onSendAnswer: (answer: string) => void;
}

export const DrawAndGuessGame: React.FC<DrawAndGuessGameProps> = ({
  roundData,
  currentPlayer,
  roundTimeLeft,
  drawingStrokes,
  chatMessages,
  onDrawStroke,
  onClearCanvas,
  onSendAnswer,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawer = currentPlayer.id === roundData.drawerId;

  const [currentColor, setCurrentColor] = useState('#F59E0B');
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPoints = useRef<DrawingPoint[]>([]);
  const [guessInput, setGuessInput] = useState('');

  const colors = ['#F59E0B', '#EF4444', '#3B82F6', '#10B981', '#EC4899', '#FFFFFF', '#000000'];

  // Redraw canvas on stroke updates
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawingStrokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  }, [drawingStrokes]);

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): DrawingPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    setIsDrawing(true);
    const p = getCanvasPos(e);
    currentPoints.current = [p];
  };

  const handleDrawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !isDrawing) return;
    const p = getCanvasPos(e);
    currentPoints.current.push(p);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const pts = currentPoints.current;
    if (pts.length >= 2) {
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();
    }
  };

  const handleEndDraw = () => {
    if (!isDrawer || !isDrawing) return;
    setIsDrawing(false);
    if (currentPoints.current.length > 0) {
      onDrawStroke({
        points: [...currentPoints.current],
        color: currentColor,
        size: brushSize,
      });
      currentPoints.current = [];
    }
  };

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim()) return;
    onSendAnswer(guessInput.trim());
    setGuessInput('');
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-3 flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-3 bg-slate-900/80 px-4 py-2 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 text-pink-400 font-bold text-xs">
          <Palette className="w-4 h-4" />
          <span>
            {isDrawer ? 'دورك في الرسم 🎨' : `الرسام الآن: ${roundData.drawerNickname}`}
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono font-bold text-amber-400 text-sm">
          <Timer className="w-4 h-4" />
          <span>{roundTimeLeft} ثانية</span>
        </div>
      </div>

      {/* Secret Word for Drawer */}
      {isDrawer && (
        <div className="w-full bg-pink-500/10 border border-pink-500/30 rounded-2xl p-2.5 mb-3 text-center animate-fadeIn">
          <span className="text-xs text-slate-300 font-bold">الكلمة المطلوب رسمها: </span>
          <span className="text-sm font-black text-pink-300 font-mono tracking-wide">
            {roundData.wordToDraw}
          </span>
        </div>
      )}

      {/* Canvas */}
      <div className="w-full bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden shadow-2xl relative">
        <canvas
          ref={canvasRef}
          width={500}
          height={320}
          onMouseDown={handleStartDraw}
          onMouseMove={handleDrawMove}
          onMouseUp={handleEndDraw}
          onMouseLeave={handleEndDraw}
          onTouchStart={handleStartDraw}
          onTouchMove={handleDrawMove}
          onTouchEnd={handleEndDraw}
          className={`w-full h-[260px] sm:h-[300px] touch-none ${
            isDrawer ? 'cursor-crosshair' : 'cursor-default'
          }`}
        />
      </div>

      {/* Drawer Tools */}
      {isDrawer ? (
        <div className="w-full mt-3 flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5">
          <div className="flex items-center gap-1.5">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrentColor(c)}
                className={`w-6 h-6 rounded-full border transition cursor-pointer ${
                  currentColor === c ? 'scale-125 border-white shadow-md' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClearCanvas}
              className="p-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800 transition cursor-pointer"
              title="مسح اللوحة"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Guessing Form for Other Players */
        <form onSubmit={handleGuessSubmit} className="w-full mt-3 flex gap-2">
          <input
            type="text"
            value={guessInput}
            onChange={(e) => setGuessInput(e.target.value)}
            placeholder="خمّن الرسمة واكتب هنا..."
            className="flex-1 bg-slate-900 border border-slate-700 focus:border-pink-400 rounded-2xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none font-bold transition"
            autoFocus
          />
          <button
            type="submit"
            disabled={!guessInput.trim()}
            className="bg-pink-500 hover:bg-pink-400 text-slate-950 px-5 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-pink-500/20"
          >
            <Send className="w-4 h-4" />
            <span>تخمين</span>
          </button>
        </form>
      )}
    </div>
  );
};

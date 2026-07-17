import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Move, Maximize2, RefreshCw } from "lucide-react";

const PI = 3.14;

// Map a section/obstacle shape to a tiny inline SVG so the block looks like the shape.
function ShapeGlyph({ kind, params, color }) {
  const stroke = color;
  const fill = color + "22";
  const common = { stroke, fill, strokeWidth: 2 };
  switch (kind) {
    case "rectangle":
    case "rect":
      return <svg width="34" height="26"><rect x="2" y="2" width="30" height="22" rx="2" {...common} /></svg>;
    case "square":
      return <svg width="26" height="26"><rect x="2" y="2" width="22" height="22" rx="2" {...common} /></svg>;
    case "circle":
      return <svg width="26" height="26"><circle cx="13" cy="13" r="11" {...common} /></svg>;
    case "half":
      return <svg width="30" height="20"><path d="M2 18 A 13 13 0 0 1 28 18 Z" {...common} /></svg>;
    case "quarter":
      return <svg width="24" height="24"><path d="M2 22 L 2 2 A 20 20 0 0 1 22 22 Z" {...common} /></svg>;
    case "triangle":
      return <svg width="30" height="24"><polygon points="15,3 28,21 2,21" {...common} /></svg>;
    case "trapezoid":
      return <svg width="32" height="22"><polygon points="6,3 26,3 30,19 2,19" {...common} /></svg>;
    case "path":
      return <svg width="34" height="20"><rect x="2" y="5" width="30" height="10" rx="4" {...common} /></svg>;
    default:
      return <svg width="30" height="22"><rect x="2" y="2" width="26" height="18" rx="2" {...common} /></svg>;
  }
}

const PALETTE = ["#0f766e", "#1d4ed8", "#b45309", "#7c3aed", "#be123c", "#0369a1", "#ca8a04", "#15803d"];

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
// size a block from its area (sqrt-scaled) for a pleasing proportional look
const sizeFromArea = (area) => clamp(70 + Math.sqrt(Math.max(0, area)) * 4.5, 70, 150);

export default function VisualPlan({ sections }) {
  // Default grid positions, stable per section id
  const initialPositions = useMemo(() => {
    const map = {};
    sections.forEach((sec, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      map[sec.id] = { x: 16 + col * 190, y: 16 + row * 180 };
    });
    return map;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [secPos, setSecPos] = useState(initialPositions);
  const [obsPos, setObsPos] = useState({});
  const [canvasRef, setCanvasRef] = useState(null);

  const reset = () => {
    setSecPos(initialPositions);
    setObsPos({});
  };

  // flatten obstacles across sections into draggable markers
  const obstacles = useMemo(() => {
    const list = [];
    sections.forEach((sec) => {
      sec.deductions.forEach((d, di) => {
        const key = `${sec.id}-${d.id}`;
        list.push({ key, secLabel: sec.label, ...d });
      });
    });
    return list;
  }, [sections]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Move size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm">Drag &amp; Drop Visualizer</h2>
            <p className="text-xs text-slate-500">Arrange sections &amp; obstacles to match your layout plan.</p>
          </div>
        </div>
        <button onClick={reset} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
          <RefreshCw size={13} /> Reset layout
        </button>
      </div>

      <div
        ref={setCanvasRef}
        className="relative w-full min-h-[320px] bg-slate-50"
        style={{
          backgroundImage:
            "linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        {/* Section blocks */}
        {sections.map((sec, i) => {
          const color = PALETTE[i % PALETTE.length];
          const size = sizeFromArea(sec.gross);
          const pos = secPos[sec.id] || { x: 16, y: 16 };
          return (
            <motion.div
              key={sec.id}
              drag
              dragMomentum={false}
              dragConstraints={canvasRef ? { left: 0, top: 0, right: canvasRef.offsetWidth - size, bottom: canvasRef.offsetHeight - size } : undefined}
              animate={{ x: pos.x, y: pos.y }}
              onDragEnd={(_, info) => setSecPos((p) => ({ ...p, [sec.id]: { x: pos.x + info.offset.x, y: pos.y + info.offset.y } }))}
              className="absolute rounded-xl shadow-md border-2 bg-white flex flex-col items-center justify-center text-center select-none cursor-grab active:cursor-grabbing"
              style={{ width: size, height: size, borderColor: color }}
            >
              <div className="opacity-90"><ShapeGlyph kind={sec.type} params={sec.params} color={color} /></div>
              <div className="text-[11px] font-bold text-slate-800 leading-tight mt-0.5 px-1">{sec.label}</div>
              <div className="text-[10px] text-slate-500">{Math.round(sec.net)} sq ft</div>
              {sec.deductions.length > 0 && (
                <div className="text-[9px] text-rose-500 font-semibold">−{sec.deductions.length} obstacle{sec.deductions.length > 1 ? "s" : ""}</div>
              )}
            </motion.div>
          );
        })}

        {/* Obstacle markers */}
        {obstacles.map((o) => {
          const def = obsPos[o.key] || { x: 240, y: 16 };
          const color = "#dc2626";
          const size = clamp(28 + Math.sqrt(Math.max(0, o.area)) * 2, 28, 56);
          return (
            <motion.div
              key={o.key}
              drag
              dragMomentum={false}
              dragConstraints={canvasRef ? { left: 0, top: 0, right: canvasRef.offsetWidth - size, bottom: canvasRef.offsetHeight - size } : undefined}
              animate={{ x: def.x, y: def.y }}
              onDragEnd={(_, info) => setObsPos((p) => ({ ...p, [o.key]: { x: def.x + info.offset.x, y: def.y + info.offset.y } }))}
              className="absolute rounded-full shadow-sm border-2 flex items-center justify-center text-center select-none cursor-grab active:cursor-grabbing"
              style={{ width: size, height: size, borderColor: color, background: color + "22" }}
            >
              <span className="text-[8px] font-bold text-rose-700 leading-none px-0.5">{o.name}</span>
            </motion.div>
          );
        })}

        {sections.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
            <Maximize2 size={18} className="mr-2" /> Add sections above to start visualizing.
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm border-2 border-indigo-600 bg-white" /> Section block</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border-2 border-rose-600" /> Obstacle (deduction)</span>
        <span>Drag any block to reposition.</span>
      </div>
    </div>
  );
}
import React, { useState, useMemo, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Move, RefreshCw, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import CurvedPath from "@/components/visualizer/CurvedPath";
import CurveEditor from "@/components/visualizer/CurveEditor";
import { ensureCurve } from "@/lib/curvePath";

const PALETTE = ["#0f766e", "#1d4ed8", "#b45309", "#7c3aed", "#be123c", "#0369a1", "#ca8a04", "#15803d"];
const OB_COLOR = "#dc2626";
const MIN_FT = 2; // min display dimension in feet so tiny shapes stay visible

// dimension (feet) of a shape/obstacle given its kind + params
function dimOf(kind, p = {}) {
  switch (kind) {
    case "rectangle":
    case "rect": return { w: Math.max(MIN_FT, p.length || 0), h: Math.max(MIN_FT, p.width || 0) };
    case "square": { const s = Math.max(MIN_FT, p.side || 0); return { w: s, h: s }; }
    case "circle": {
      const r = p.radius != null ? p.radius : (p.diameter || 0) / 2;
      const d = Math.max(MIN_FT, r * 2); return { w: d, h: d };
    }
    case "half": { const d = Math.max(MIN_FT, (p.radius || 0) * 2); return { w: d, h: Math.max(MIN_FT, p.radius || 0) }; }
    case "quarter": { const s = Math.max(MIN_FT, p.radius || 0); return { w: s, h: s }; }
    case "triangle": return { w: Math.max(MIN_FT, p.base || 0), h: Math.max(MIN_FT, p.height || 0) };
    case "trapezoid": return { w: Math.max(MIN_FT, Math.max(p.a || 0, p.b || 0)), h: Math.max(MIN_FT, p.height || 0) };
    case "path": return { w: Math.min(60, Math.max(MIN_FT, p.linear || 0)), h: Math.max(MIN_FT, p.width || 0) };
    default: return { w: MIN_FT, h: MIN_FT };
  }
}

// draw the shape in a box of w×h (feet) — viewBox matches so it stays proportional
function ShapeSvg({ kind, p, w, h, color, strokeW = 0.4 }) {
  const fill = color + "33";
  const stroke = color;
  const common = { fill, stroke, strokeWidth: strokeW };
  switch (kind) {
    case "rectangle":
    case "rect":
      return <rect x={0} y={0} width={w} height={h} rx={Math.min(0.6, w / 8)} {...common} />;
    case "square":
      return <rect x={0} y={0} width={w} height={h} rx={0.4} {...common} />;
    case "circle":
      return <circle cx={w / 2} cy={h / 2} r={w / 2} {...common} />;
    case "half":
      return <path d={`M0 ${h} A ${w / 2} ${h} 0 0 1 ${w} ${h} Z`} {...common} />;
    case "quarter":
      return <path d={`M0 ${h} L 0 0 A ${w} ${h} 0 0 1 ${w} ${h} Z`} {...common} />;
    case "triangle":
      return <polygon points={`${w / 2},0 ${w},${h} 0,${h}`} {...common} />;
    case "trapezoid": {
      const top = Math.max(p.a || 0, p.b || 0);
      const off = (w - top) / 2;
      return <polygon points={`${off},0 ${off + top},0 ${w},${h} 0,${h}`} {...common} />;
    }
    case "path":
      return <rect x={0} y={0} width={w} height={h} rx={Math.min(h / 2, 1)} {...common} />;
    default:
      return <rect x={0} y={0} width={w} height={h} {...common} />;
  }
}

function Block({ item, color, scale, pos, rotation, onDragEnd, onRotate, dragBounds }) {
  const { w, h } = dimOf(item.kind || item.type, item.params);
  const pxW = Math.max(44, w * scale);
  const pxH = Math.max(44, h * scale);
  const rot = rotation || 0;
  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={dragBounds ? { left: 0, top: 0, right: Math.max(0, dragBounds.w - pxW), bottom: Math.max(0, dragBounds.h - pxH) } : undefined}
      animate={{ x: pos.x, y: pos.y }}
      onDragEnd={(_, info) => onDragEnd(pos.x + info.offset.x, pos.y + info.offset.y)}
      className="absolute select-none cursor-grab active:cursor-grabbing group"
      style={{ width: pxW, height: pxH, transform: `rotate(${rot}deg)`, transformOrigin: "center center" }}
    >
      <svg width={pxW} height={pxH} viewBox={`0 0 ${w} ${h}`} className="block drop-shadow-sm rounded-md overflow-visible">
        <ShapeSvg kind={item.kind || item.type} p={item.params} w={w} h={h} color={color} />
      </svg>
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-5 whitespace-nowrap text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/90 border border-slate-200 shadow-sm" style={{ color }}>
        {item.label || item.name}
      </div>
      {item.net != null && (
        <div className="absolute left-1/2 -translate-x-1/2 top-1 text-[8px] font-semibold text-slate-700 bg-white/80 rounded px-1">
          {Math.round(item.net)} ft²
        </div>
      )}
      {onRotate && (
        <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition flex flex-col gap-0.5">
          <button onClick={(e) => { e.stopPropagation(); onRotate((rot + 15) % 360); }} className="w-6 h-6 rounded-full bg-white border border-slate-300 shadow flex items-center justify-center text-slate-600 hover:text-indigo-600" title="Rotate 15°">
            <RotateCw size={12} />
          </button>
        </div>
      )}
    </motion.div>
  );
}

// Controlled-by-default visualizer. Parent may pass initialLayout (persisted) and
// onLayoutChange to capture zoom + positions for saving.
export default function VisualPlan({ sections, initialLayout, onLayoutChange, editable = true, onUpdateDeduction }) {
  const [scale, setScale] = useState(initialLayout?.scale ?? 6);
  const [selectedKey, setSelectedKey] = useState(null);
  const prevScale = useRef(scale);
  const canvasRef = useRef(null);

  const [secPos, setSecPos] = useState(initialLayout?.secPos || {});
  const [obsPos, setObsPos] = useState(initialLayout?.obsPos || {});
  const [secRot, setSecRot] = useState(initialLayout?.secRot || {});
  const [obsRot, setObsRot] = useState(initialLayout?.obsRot || {});

  // default grid positions keyed by id (feet-units-agnostic; just px)
  const defaults = useMemo(() => {
    const map = {};
    sections.forEach((sec, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      map[sec.id] = { x: 20 + col * 210, y: 24 + row * 200 };
    });
    return map;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pos = (id, store) => store[id] ?? defaults[id] ?? { x: 240, y: 30 };

  const obstacles = useMemo(() => {
    const list = [];
    sections.forEach((sec) => (sec.deductions || []).forEach((d) => list.push({ ...d, key: `${sec.id}-${d.id}`, secLabel: sec.label })));
    return list;
  }, [sections]);

  const emit = useCallback((next) => {
    if (onLayoutChange) onLayoutChange(next);
  }, [onLayoutChange]);

  const setScaleAndRescale = useCallback((next) => {
    const ratio = next / prevScale.current;
    prevScale.current = next;
    setScale(next);
    setSecPos((p) => {
      const out = {};
      Object.keys(p).forEach((k) => (out[k] = { x: p[k].x * ratio, y: p[k].y * ratio }));
      emit({ scale: next, secPos: out, obsPos, secRot, obsRot });
      return out;
    });
    setObsPos((p) => {
      const out = {};
      Object.keys(p).forEach((k) => (out[k] = { x: p[k].x * ratio, y: p[k].y * ratio }));
      emit({ scale: next, secPos, obsPos: out, secRot, obsRot });
      return out;
    });
  }, [emit, obsPos, secPos, secRot, obsRot]);

  const reset = () => {
    setSecPos({}); setObsPos({});
    emit({ scale, secPos: {}, obsPos: {}, secRot, obsRot });
  };

  const onSecDrag = (id, x, y) => {
    const next = { ...secPos, [id]: { x, y } };
    setSecPos(next);
    emit({ scale, secPos: next, obsPos, secRot, obsRot });
  };
  const onObsDrag = (key, x, y) => {
    const next = { ...obsPos, [key]: { x, y } };
    setObsPos(next);
    emit({ scale, secPos, obsPos: next, secRot, obsRot });
  };
  const onSecRotate = (id, deg) => { const n = { ...secRot, [id]: deg }; setSecRot(n); emit({ scale, secPos, obsPos, secRot: n, obsRot }); };
  const onObsRotate = (key, deg) => { const n = { ...obsRot, [key]: deg }; setObsRot(n); emit({ scale, secPos, obsPos, secRot, obsRot: n }); };

  const bounds = canvasRef.current ? { w: canvasRef.current.offsetWidth, h: canvasRef.current.offsetHeight } : null;

  const canvasMinH = Math.max(320, sections.length * 60 + obstacles.length * 40);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Move size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm">Drag &amp; Drop Visualizer</h2>
            <p className="text-xs text-slate-500">True-to-dimension shapes — zoom keeps proportions exact.</p>
          </div>
        </div>
        {editable && (
          <div className="flex items-center gap-2">
            <button onClick={() => setScaleAndRescale(Math.max(2, scale - 1))} className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-800"><ZoomOut size={15} /></button>
            <div className="text-xs font-semibold text-slate-600 w-16 text-center">{scale} px / ft</div>
            <button onClick={() => setScaleAndRescale(Math.min(20, scale + 1))} className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-800"><ZoomIn size={15} /></button>
            <button onClick={reset} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 ml-1">
              <RefreshCw size={13} /> Reset
            </button>
          </div>
        )}
      </div>

      <div
        ref={canvasRef}
        className="relative w-full"
        style={{
          minHeight: canvasMinH,
          backgroundImage: "linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)",
          backgroundSize: `${scale * 2}px ${scale * 2}px`,
        }}
      >
        {sections.map((sec, i) => (
          <Block
            key={sec.id}
            item={{ ...sec, kind: sec.type }}
            color={PALETTE[i % PALETTE.length]}
            scale={scale}
            pos={pos(sec.id, secPos)}
            rotation={secRot[sec.id]}
            onDragEnd={(x, y) => onSecDrag(sec.id, x, y)}
            onRotate={editable ? (deg) => onSecRotate(sec.id, deg) : undefined}
            dragBounds={bounds}
          />
        ))}
        {obstacles.map((o) =>
          o.kind === "path" ? (
            <CurvedPath
              key={o.key}
              item={o}
              color={OB_COLOR}
              scale={scale}
              pos={pos(o.key, obsPos)}
              selected={selectedKey === o.key}
              onSelect={() => setSelectedKey(o.key)}
              onUpdateCurve={(patch) => onUpdateDeduction && onUpdateDeduction(o.id, { curve: { ...ensureCurve(o.curve), ...patch } })}
              onDragEnd={(x, y) => onObsDrag(o.key, x, y)}
              editable={editable}
            />
          ) : (
            <Block
              key={o.key}
              item={o}
              color={OB_COLOR}
              scale={scale}
              pos={pos(o.key, obsPos)}
              rotation={obsRot[o.key]}
              onDragEnd={(x, y) => onObsDrag(o.key, x, y)}
              onRotate={editable ? (deg) => onObsRotate(o.key, deg) : undefined}
              dragBounds={bounds}
            />
          )
        )}
      </div>

      {/* Curve editor for the selected curved path */}
      {editable && selectedKey && (() => {
        const o = obstacles.find((x) => x.key === selectedKey);
        if (!o || o.kind !== "path") return null;
        return (
          <CurveEditor
            obstacle={o}
            curve={ensureCurve(o.curve)}
            onUpdateCurve={(patch) => onUpdateDeduction && onUpdateDeduction(o.id, { curve: { ...ensureCurve(o.curve), ...patch } })}
          />
        );
      })()}

      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1 items-center">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm border-2 border-indigo-600 bg-white" /> Section (true dimensions)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border-2 border-rose-600" /> Obstacle (deduction)</span>
        <span>Use +/− to scale — proportions stay locked.</span>
      </div>
    </div>
  );
}
import React from "react";
import { RotateCcw, RotateCw, Undo2, Redo2, Spline, Plus, Minus, FlipHorizontal, Eraser, Lock, Unlock, Maximize2 } from "lucide-react";
import { CURVE_STYLES, ensureCurve } from "@/lib/curvePath";
import { fmt } from "@/lib/deductionUtils";

// Toolbar + selected-object panel shown when a Curved Walkway is selected.
// All controls mutate the visual `curve` object only — never the measured
// centerline length, widths, or calculated area.
export default function CurveEditor({ obstacle, curve, onUpdateCurve, onSelect }) {
  const c = ensureCurve(curve);
  const L = obstacle.params?.linear || 0;
  const W = obstacle.params?.width || 0;
  const widths = obstacle.params?.widths;
  const area = L * W;

  const set = (patch) => onUpdateCurve(patch);
  const rotate = (d) => set({ rotation: ((c.rotation || 0) + d + 360) % 360 });
  const bend = (delta) => set({ amount: Math.max(-100, Math.min(100, (c.amount || 0) + delta)) });

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800"><Spline size={14} /> CURVE CONTROLS — {obstacle.label || obstacle.name}</div>
        <div className="flex flex-wrap gap-1.5">
          <TBtn onClick={() => bend(-10)}><Undo2 size={14} /> Left</TBtn>
          <TBtn onClick={() => bend(10)}><Redo2 size={14} /> Right</TBtn>
          <TBtn onClick={() => bend(5)}><Plus size={14} /> More</TBtn>
          <TBtn onClick={() => bend(-5)}><Minus size={14} /> Less</TBtn>
          <TBtn onClick={() => set({ amount: 0 })}><Eraser size={14} /> Straighten</TBtn>
          <TBtn onClick={() => set({ amount: -(c.amount || 0) })}><FlipHorizontal size={14} /> Reverse</TBtn>
          <TBtn onClick={() => set({ style: c.style === "scurve" ? "single" : "scurve" })}><Spline size={14} /> {c.style === "scurve" ? "→ Single" : "→ S-curve"}</TBtn>
          <TBtn onClick={() => set({ rotation: 0, amount: 0, style: "single" })}>Reset curve</TBtn>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 w-20">Curve amount</span>
          <input
            type="range" min="-100" max="100" value={c.amount || 0}
            onChange={(e) => set({ amount: parseInt(e.target.value) })}
            className="flex-1 accent-indigo-600"
          />
          <span className="text-xs font-mono w-10 text-right">{c.amount || 0}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 w-20">Curve style</span>
          <select value={c.style} onChange={(e) => set({ style: e.target.value })} className="text-xs h-8 rounded-md border border-input bg-white px-2 flex-1">
            {CURVE_STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Selected-object edit panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
        <div className="text-xs font-bold text-slate-700">ACTUAL MEASUREMENTS (unchanged)</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <M k="Centerline" v={`${fmt(L)} ft`} />
          {Array.isArray(widths) && widths.length > 1
            ? widths.map((w, i) => <M key={i} k={`Width ${i + 1}`} v={`${fmt(parseFloat(w) || 0)} ft`} />)
            : <M k="Width" v={`${fmt(W)} ft`} />}
          <M k="Avg width" v={`${fmt(W)} ft`} />
          <M k="Area" v={`${fmt(area)} sq ft`} />
        </div>
        <p className="text-[11px] text-emerald-700 bg-emerald-50 rounded px-2 py-1">
          Visual curve changed. Measured centerline remains {fmt(L)} ft.
        </p>

        <div className="text-xs font-bold text-slate-700 pt-1">VISUAL SETTINGS</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <M k="Rotation" v={`${c.rotation || 0}°`} />
          <M k="Bends" v={String(c.style === "scurve" || c.style === "freeform" ? 2 : c.amount ? 1 : 0)} />
          <M k="Display width" v={c.visualWidthLinked ? `${fmt(W)} ft (linked)` : `${fmt(c.displayWidth ?? W)} ft`} />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <input type="checkbox" checked={c.visualWidthLinked} onChange={(e) => set({ visualWidthLinked: e.target.checked })} />
            Link visual width to measured width
          </label>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          <TBtn onClick={() => set({ amount: 0 })}>Straighten</TBtn>
          <TBtn onClick={() => set({ rotation: 0, amount: 0, style: "single", displayWidth: null, visualWidthLinked: true })}>Reset curve</TBtn>
          <TBtn onClick={() => set({ visualWidthLinked: true, displayWidth: null })}><Maximize2 size={13} /> Fit to actual width</TBtn>
          <TBtn onClick={() => set({ lockPosition: !c.lockPosition })}>{c.lockPosition ? <Unlock size={13} /> : <Lock size={13} />} {c.lockPosition ? "Unlock pos" : "Lock pos"}</TBtn>
          <TBtn onClick={() => set({ locked: !c.locked })}>{c.locked ? <Unlock size={13} /> : <Lock size={13} />} {c.locked ? "Unlock curve" : "Lock curve"}</TBtn>
          <TBtn onClick={() => rotate(-15)}><RotateCcw size={13} /> 15°</TBtn>
          <TBtn onClick={() => rotate(15)}><RotateCw size={13} /> 15°</TBtn>
          <TBtn onClick={() => rotate(-1)}>−1°</TBtn>
          <TBtn onClick={() => rotate(1)}>+1°</TBtn>
          <input type="number" min="0" max="359" value={c.rotation || 0} onChange={(e) => set({ rotation: Math.max(0, Math.min(359, parseInt(e.target.value) || 0)) })} className="h-8 w-16 text-xs rounded-md border border-input px-2" />°
        </div>
      </div>
    </div>
  );
}

function TBtn({ children, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95 transition">
      {children}
    </button>
  );
}
function M({ k, v }) {
  return <div className="flex justify-between"><span className="text-slate-400">{k}:</span><strong>{v}</strong></div>;
}
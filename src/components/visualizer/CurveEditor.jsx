import React, { useEffect, useRef } from "react";
import {
  RotateCcw, RotateCw, Undo2, Redo2, Spline, Plus, Eraser, Lock, Unlock,
  Maximize2, Grid3x3, Ruler, Crosshair, Move, Magnet, Sparkles, Trash2, Eye, EyeOff,
} from "lucide-react";
import {
  CURVE_STYLES, SNAP_PRESETS, UNIT_OPTIONS, ensureCurve, curveGeometry,
  formatDim, buildPoints, normalizeSplineLength,
} from "@/lib/curvePath";
import { fmt } from "@/lib/deductionUtils";

// Toolbar + panel shown when a Curved Walkway is selected. Every control mutates
// only the visual `curve` object — the measured centerline, station widths, and
// field-estimated area are never changed unless the user explicitly unlocks and
// confirms. Undo/redo is local to the editor session (not persisted).
export default function CurveEditor({ obstacle, curve, onUpdateCurve, onSelect }) {
  const c = ensureCurve(curve);
  const L = obstacle.params?.linear || 0;
  const W = obstacle.params?.width || 0;
  const widths = obstacle.params?.widths;
  const borderWidth = obstacle.params?.borderWidth || 0;
  const geo = curveGeometry(curve, L, W, widths);

  // ---- undo / redo with drag coalescing ----
  const pastRef = useRef([]);
  const futureRef = useRef([]);
  const lastCurveRef = useRef(curve);
  const lastTsRef = useRef(0);

  useEffect(() => {
    const prev = lastCurveRef.current;
    if (prev !== curve) {
      const now = Date.now();
      if (now - lastTsRef.current < 350 && pastRef.current.length) {
        pastRef.current[pastRef.current.length - 1] = prev;
      } else {
        pastRef.current.push(prev);
        if (pastRef.current.length > 60) pastRef.current.shift();
      }
      futureRef.current = [];
      lastTsRef.current = now;
      lastCurveRef.current = curve;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curve]);

  const set = (patch) => onUpdateCurve(patch);

  const undo = () => {
    if (!pastRef.current.length) return;
    const prev = pastRef.current.pop();
    futureRef.current.push(curve);
    lastCurveRef.current = prev;
    onUpdateCurve(prev);
  };
  const redo = () => {
    if (!futureRef.current.length) return;
    const next = futureRef.current.pop();
    pastRef.current.push(curve);
    lastCurveRef.current = next;
    onUpdateCurve(next);
  };

  const rotate = (d) => set({ rotation: ((c.rotation || 0) + d + 360) % 360 });

  const regenerate = (style) => {
    const bend = (c.amount || 40) / 100 * (L * 0.35);
    let pts;
    if (style === "scurve" || style === "freeform") {
      pts = [{ x: 0, y: 0 }, { x: L * 0.25, y: -bend }, { x: L * 0.75, y: bend }, { x: L, y: 0 }];
    } else {
      pts = [{ x: 0, y: 0 }, { x: L / 2, y: -bend }, { x: L, y: 0 }];
    }
    set({ style, points: c.measurementLock ? normalizeSplineLength(pts, L) : pts });
  };

  const resetShape = () => set({ points: [{ x: 0, y: 0 }, { x: L, y: 0 }], amount: 0, style: "single" });

  const smoothCurve = () => {
    // re-space interior handles evenly along x, average their y
    const pts = buildPoints(c, L);
    if (pts.length <= 3) return set({ points: c.measurementLock ? normalizeSplineLength(pts, L) : pts });
    const n = pts.length;
    const spaced = pts.map((p, i) => ({ x: (i / (n - 1)) * L, y: p.y * 0.5 }));
    spaced[0] = { x: 0, y: 0 };
    spaced[n - 1] = { x: L, y: 0 };
    set({ points: c.measurementLock ? normalizeSplineLength(spaced, L) : spaced });
  };

  const addHandle = () => {
    const pts = [...buildPoints(c, L)];
    const at = Math.max(1, Math.floor(pts.length / 2));
    const a = pts[at - 1], b = pts[at];
    pts.splice(at, 0, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    set({ points: c.measurementLock ? normalizeSplineLength(pts, L) : pts });
  };

  const deleteLastInterior = () => {
    const pts = buildPoints(c, L);
    if (pts.length <= 3) return;
    const trimmed = pts.filter((_, i) => i !== pts.length - 2);
    set({ points: c.measurementLock ? normalizeSplineLength(trimmed, L) : trimmed });
  };

  const toggleLock = () => {
    if (c.measurementLock) { set({ measurementLock: false }); return; }
    // Re-locking re-normalizes the visual handle points so the rendered
    // centerline matches the measured length. Measurements live in `params`,
    // not `points`, so no field data is lost — no confirmation needed.
    const pts = L > 0 ? normalizeSplineLength(buildPoints(c, L), L) : buildPoints(c, L);
    set({ measurementLock: true, points: pts });
  };

  const diff = geo.geometryArea - geo.fieldArea;

  return (
    <div className="space-y-3">
      {/* Lock banner */}
      <div className={`rounded-xl p-3 flex items-center justify-between border ${c.measurementLock ? "bg-emerald-50 border-emerald-300" : "bg-amber-50 border-amber-300"}`}>
        <div className="flex items-center gap-2">
          {c.measurementLock ? <Lock size={16} className="text-emerald-700" /> : <Unlock size={16} className="text-amber-700" />}
          <div>
            <div className={`text-sm font-bold ${c.measurementLock ? "text-emerald-800" : "text-amber-800"}`}>
              {c.measurementLock ? "Measurements Locked" : "Measurements Unlocked"}
            </div>
            <div className="text-[11px] text-slate-500">
              {c.measurementLock ? "Bending changes shape only — field values stay exact." : "You can edit measurements. Calculated values shown as 'Calculated'."}
            </div>
          </div>
        </div>
        <button onClick={toggleLock} className={`text-xs font-bold px-3 py-2 rounded-lg ${c.measurementLock ? "bg-amber-500 text-white" : "bg-emerald-700 text-white"}`}>
          {c.measurementLock ? "Unlock" : "Lock"}
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800"><Spline size={14} /> CURVE CONTROLS — {obstacle.label || obstacle.name}</div>
        <div className="flex flex-wrap gap-1.5">
          <TBtn onClick={undo}><Undo2 size={14} /> Undo</TBtn>
          <TBtn onClick={redo}><Redo2 size={14} /> Redo</TBtn>
          <TBtn onClick={resetShape}><Eraser size={14} /> Reset Shape</TBtn>
          <TBtn onClick={smoothCurve}><Sparkles size={14} /> Smooth</TBtn>
          <TBtn onClick={addHandle}><Plus size={14} /> Add Handle</TBtn>
          <TBtn onClick={deleteLastInterior}><Trash2 size={14} /> Delete Handle</TBtn>
          <TBtn onClick={() => set({ fineAdjust: !c.fineAdjust })}><Crosshair size={14} /> Fine {c.fineAdjust ? "ON" : "off"}</TBtn>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 w-20 flex items-center gap-1"><Magnet size={12} /> Snap</span>
          <select value={c.snap} onChange={(e) => set({ snap: e.target.value })} className="text-xs h-8 rounded-md border border-input bg-white px-2 flex-1">
            {SNAP_PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 w-20">Curve type</span>
          <select value={c.style} onChange={(e) => regenerate(e.target.value)} className="text-xs h-8 rounded-md border border-input bg-white px-2 flex-1">
            {CURVE_STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 pt-1">
          <input type="checkbox" checked={c.moveEndpoints} onChange={(e) => set({ moveEndpoints: e.target.checked })} />
          <Move size={12} /> Move Endpoints (start/end anchors draggable)
        </label>
      </div>

      {/* View controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
        <div className="text-xs font-bold text-slate-700 flex items-center gap-1"><Eye size={13} /> VIEW CONTROLS</div>
        <div className="flex flex-wrap gap-1.5">
          <TBtn onClick={() => set({ rotation: 0 })}><Maximize2 size={13} /> Top View</TBtn>
          <TBtn onClick={() => rotate(-15)}><RotateCcw size={13} /> 15°</TBtn>
          <TBtn onClick={() => rotate(15)}><RotateCw size={13} /> 15°</TBtn>
          <TBtn onClick={() => rotate(-1)}>−1°</TBtn>
          <TBtn onClick={() => rotate(1)}>+1°</TBtn>
          <TBtn onClick={() => set({ showGrid: !c.showGrid })}><Grid3x3 size={13} /> Grid {c.showGrid ? "ON" : "off"}</TBtn>
          <TBtn onClick={() => set({ showHandles: !c.showHandles })}>{c.showHandles ? <Eye size={13} /> : <EyeOff size={13} />} Handles</TBtn>
          <TBtn onClick={() => set({ showDimensions: !c.showDimensions })}><Ruler size={13} /> Dims {c.showDimensions ? "ON" : "off"}</TBtn>
          <TBtn onClick={() => set({ rotation: 0, showGrid: true, showHandles: true, showDimensions: true })}>Reset View</TBtn>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 w-20">Rotation</span>
          <input type="number" min="0" max="359" value={c.rotation || 0} onChange={(e) => set({ rotation: Math.max(0, Math.min(359, parseInt(e.target.value) || 0)) })} className="h-8 w-16 text-xs rounded-md border border-input px-2" />°
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 w-20">Units</span>
          <select value={c.units} onChange={(e) => set({ units: e.target.value })} className="text-xs h-8 rounded-md border border-input bg-white px-2 flex-1">
            {UNIT_OPTIONS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </div>
      </div>

      {/* Area + measurements panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
        <div className="text-xs font-bold text-slate-700">FIELD MEASUREMENTS (authoritative)</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <M k="Centerline" v={formatDim(L, c.units)} />
          {Array.isArray(widths) && widths.length > 1
            ? widths.map((w, i) => <M key={i} k={`Width ${i + 1}`} v={formatDim(parseFloat(w) || 0, c.units)} />)
            : <M k="Width" v={formatDim(W, c.units)} />}
          <M k="Avg width" v={formatDim(W, c.units)} />
          <M k="Field area" v={`${fmt(geo.fieldArea)} sq ft`} tag="Field Measured" />
        </div>

        <div className="text-xs font-bold text-slate-700 pt-1">GEOMETRY (from drawing)</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <M k="Rendered CL" v={formatDim(geo.renderedLen, c.units)} tag="Calculated" />
          <M k="Geometry area" v={`${fmt(geo.geometryArea)} sq ft`} tag="Calculated" />
          <M k="Difference" v={`${diff >= 0 ? "+" : ""}${fmt(diff)} sq ft`} />
          {borderWidth > 0 && <M k="Border length" v={formatDim(L, c.units)} />}
          <M k="Deduction area" v={`${fmt(geo.fieldArea)} sq ft`} />
        </div>

        {c.measurementLock ? (
          <p className="text-[11px] text-emerald-700 bg-emerald-50 rounded px-2 py-1">
            Visual curve changed. Measured centerline remains {formatDim(L, c.units)}; area stays {fmt(geo.fieldArea)} sq ft.
          </p>
        ) : (
          <p className="text-[11px] text-amber-700 bg-amber-50 rounded px-2 py-1">
            Measurements unlocked — field values may be edited. Values marked “Calculated” are derived from the drawing, not field-measured.
          </p>
        )}

        <div className="text-xs font-bold text-slate-700 pt-1">VISUAL SETTINGS</div>
        <div className="flex flex-wrap gap-1.5">
          <TBtn onClick={() => set({ visualWidthLinked: true, displayWidth: null })}><Maximize2 size={13} /> Fit to measured width</TBtn>
          <TBtn onClick={() => set({ lockPosition: !c.lockPosition })}>{c.lockPosition ? <Unlock size={13} /> : <Lock size={13} />} {c.lockPosition ? "Unlock pos" : "Lock pos"}</TBtn>
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
function M({ k, v, tag }) {
  return (
    <div className="flex justify-between gap-1">
      <span className="text-slate-400">{k}:</span>
      <strong className="text-right">{v}{tag && <span className="block text-[9px] font-normal text-slate-400">{tag}</span>}</strong>
    </div>
  );
}
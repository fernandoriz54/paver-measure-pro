import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Plus } from "lucide-react";
import {
  curveGeometry,
  ensureCurve,
  snapFeet,
  formatDim,
  normalizeSplineLength,
} from "@/lib/curvePath";

// Renders a path-kind obstacle as a true curved band (centerline + offset
// boundaries) with draggable bend/width handles. Visual only — the measured
// centerline length and station widths never change; the spline is normalized
// so its rendered arc length equals the locked field measurement.
export default function CurvedPath({
  item,
  color,
  scale,
  pos,
  onSelect,
  selected,
  onUpdateCurve,
  onDragEnd,
  editable,
}) {
  const L = Math.max(2, item.params?.linear || 0);
  const W = Math.max(0.5, item.params?.width || 0);
  const widths = item.params?.widths;
  const c = ensureCurve(item.curve);
  const geo = curveGeometry(item.curve, L, W, widths);

  const divRef = useRef(null);
  const svgRef = useRef(null);
  const [selectedHandle, setSelectedHandle] = useState(null);

  const fill = color + "33";
  const stroke = color;

  // Convert a screen pointer movement to local feet, accounting for rotation.
  const screenToLocal = (dxPx, dyPx) => {
    const rad = (-((c.rotation || 0) * Math.PI)) / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    const dxFt = dxPx / scale, dyFt = dyPx / scale;
    return { x: dxFt * cos - dyFt * sin, y: dxFt * sin + dyFt * cos };
  };

  const startHandleDrag = (e, idx) => {
    if (!editable) return;
    const isEnd = idx === 0 || idx === geo.points.length - 1;
    // Start/end anchors are measurement anchors — they stay fixed while locked.
    if (isEnd && c.measurementLock) return;
    e.stopPropagation();
    onSelect();
    setSelectedHandle(idx);
    const startX = e.clientX, startY = e.clientY;
    const p0 = geo.points[idx];
    const move = (ev) => {
      const local = screenToLocal(ev.clientX - startX, ev.clientY - startY);
      let nx = p0.x + local.x;
      let ny = p0.y + local.y;
      if (!c.moveEndpoints && isEnd) { nx = idx === 0 ? 0 : L; ny = 0; }
      nx = Math.max(0, Math.min(L, nx));
      ny = snapFeet(ny, c.snap);
      const newPoints = geo.points.map((p, i) => (i === idx ? { x: nx, y: ny } : p));
      // Only re-normalize interior reshapes — never override an intentional
      // endpoint move (which is itself a measurement edit, allowed only unlocked).
      let resolved = newPoints;
      if (c.measurementLock && !isEnd) {
        resolved = normalizeSplineLength(newPoints, L);
      }
      onUpdateCurve({ points: resolved });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: false });
  };

  // Tap the centerline to add a new bend handle at the nearest point.
  const addHandleAtEvent = (e) => {
    if (!editable || !selected) return;
    e.stopPropagation();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = (e.clientX - rect.left) / scale + geo.bounds.minX;
    const py = (e.clientY - rect.top) / scale + geo.bounds.minY;
    // invert rotation to get local coords
    const rad = (-((c.rotation || 0) * Math.PI)) / 180;
    const cx = geo.bounds.minX + geo.bounds.w / 2;
    const cy = geo.bounds.minY + geo.bounds.h / 2;
    const dx = px - cx, dy = py - cy;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    const lx = cx + dx * cos - dy * sin;
    const ly = cy + dx * sin + dy * cos;
    // insert between the two nearest points by x
    const pts = [...geo.points];
    let insertAt = pts.length - 1;
    for (let i = 0; i < pts.length - 1; i++) {
      if (lx >= pts[i].x && lx <= pts[i + 1].x) { insertAt = i + 1; break; }
    }
    pts.splice(insertAt, 0, { x: Math.max(0, Math.min(L, lx)), y: snapFeet(ly, c.snap) });
    const resolved = c.measurementLock ? normalizeSplineLength(pts, L) : pts;
    onUpdateCurve({ points: resolved });
  };

  const removeSelectedHandle = () => {
    if (selectedHandle == null) return;
    if (selectedHandle === 0 || selectedHandle === geo.points.length - 1) return;
    if (geo.points.length <= 3) return; // keep start + one bend + end
    const pts = geo.points.filter((_, i) => i !== selectedHandle);
    const resolved = c.measurementLock ? normalizeSplineLength(pts, L) : pts;
    onUpdateCurve({ points: resolved });
    setSelectedHandle(null);
  };

  const pxW = geo.bounds.h * scale;
  const pxL = geo.bounds.w * scale;
  const vb = `${geo.bounds.minX} ${geo.bounds.minY} ${geo.bounds.w} ${geo.bounds.h}`;
  const off = (pt) => ({ left: (pt.x - geo.bounds.minX) * scale, top: (pt.y - geo.bounds.minY) * scale });

  return (
    <motion.div
      ref={divRef}
      drag={editable && !c.lockPosition}
      dragMomentum={false}
      animate={{ x: pos.x, y: pos.y, rotate: c.rotation || 0 }}
      onPointerDown={() => editable && onSelect()}
      onDragEnd={(_, info) => onDragEnd(pos.x + info.offset.x, pos.y + info.offset.y)}
      className="absolute select-none"
      style={{ width: pxL, height: pxW, transformOrigin: "center center", cursor: c.lockPosition ? "default" : "grab", touchAction: "none" }}
    >
      <svg ref={svgRef} width={pxL} height={pxW} viewBox={vb} className="overflow-visible" onDoubleClick={addHandleAtEvent}>
        {c.showGrid && (
          <defs>
            <pattern id={`grid-${item.id}`} width="2" height="2" patternUnits="userSpaceOnUse">
              <path d="M 2 0 L 0 0 0 2" fill="none" stroke="#e2e8f0" strokeWidth="0.08" />
            </pattern>
          </defs>
        )}
        {c.showGrid && <rect x={geo.bounds.minX} y={geo.bounds.minY} width={geo.bounds.w} height={geo.bounds.h} fill={`url(#grid-${item.id})`} opacity="0.4" />}

        {/* filled band = stroked centerline with round caps */}
        <path d={pathD(geo.band.center)} fill="none" stroke={fill} strokeWidth={geo.bandWidth} strokeLinejoin="round" strokeLinecap="round" />
        <path d={pathD(geo.band.center)} fill="none" stroke={stroke} strokeWidth={geo.bandWidth + 0.3} strokeLinejoin="round" strokeLinecap="round" opacity={0.15} />
        {/* left + right boundaries */}
        <path d={pathD(geo.band.left)} fill="none" stroke={stroke} strokeWidth="0.2" />
        <path d={pathD(geo.band.right)} fill="none" stroke={stroke} strokeWidth="0.2" />
        {/* centerline (dashed) */}
        <path d={pathD(geo.band.center)} fill="none" stroke={stroke} strokeWidth="0.18" strokeDasharray="0.8 0.8" />

        {/* width-station dimension lines */}
        {c.showDimensions && geo.band.dimLines.map((dl, i) => (
          <g key={i}>
            <line x1={dl.a.x} y1={dl.a.y} x2={dl.b.x} y2={dl.b.y} stroke={stroke} strokeWidth="0.18" />
            <circle cx={dl.a.x} cy={dl.a.y} r="0.18" fill={stroke} />
            <circle cx={dl.b.x} cy={dl.b.y} r="0.18" fill={stroke} />
            <text x={(dl.a.x + dl.b.x) / 2} y={(dl.a.y + dl.b.y) / 2 - 0.4} fontSize="0.7" fill={stroke} textAnchor="middle" fontWeight="bold">
              {formatDim(dl.width, c.units)}
            </text>
          </g>
        ))}

        {/* centerline length label */}
        {c.showDimensions && (
          <text x={L / 2} y={geo.bounds.minY + 0.6} fontSize="0.75" fill={stroke} textAnchor="middle" fontWeight="bold">
            CL {formatDim(L, c.units)}
          </text>
        )}

        {/* start / end caps */}
        <circle cx={geo.points[0].x} cy={geo.points[0].y} r="0.4" fill={stroke} />
        <circle cx={geo.points[geo.points.length - 1].x} cy={geo.points[geo.points.length - 1].y} r="0.4" fill={stroke} />
      </svg>

      {/* label */}
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-5 whitespace-nowrap text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/90 border border-slate-200 shadow-sm" style={{ color: stroke }}>
        {item.label || item.name}
      </div>

      {/* interaction handles */}
      {selected && editable && c.showHandles && (
        <>
          {geo.points.map((p, i) => {
            const isEnd = i === 0 || i === geo.points.length - 1;
            const o = off(p);
            const isSel = selectedHandle === i;
            const size = isEnd ? 14 : isSel ? 20 : 16;
            return (
              <div
                key={i}
                onPointerDown={(e) => startHandleDrag(e, i)}
                className={`absolute rounded-full border-2 shadow ${isEnd ? "bg-slate-100 border-slate-400" : isSel ? "bg-white border-indigo-600 ring-2 ring-indigo-300" : "bg-white"} ${c.measurementLock && isEnd ? "cursor-not-allowed" : "cursor-move"}`}
                style={{ left: o.left, top: o.top, width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, borderColor: isEnd ? undefined : stroke, touchAction: "none" }}
                title={isEnd ? "Anchor (locked)" : "Drag to bend · double-click path to add"}
              />
            );
          })}
          {/* delete the selected interior handle */}
          {selectedHandle != null && selectedHandle !== 0 && selectedHandle !== geo.points.length - 1 && geo.points.length > 3 && (
            <button
              onClick={removeSelectedHandle}
              className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-600 text-white shadow"
              style={{ left: off(geo.points[selectedHandle]).left }}
            >
              Delete handle
            </button>
          )}
          {/* hint to add */}
          <div className="absolute -top-3 -right-3 text-[9px] text-slate-400 bg-white/80 rounded px-1 flex items-center gap-0.5"><Plus size={9} /> dbl-click</div>
        </>
      )}

      {c.measurementLock && (
        <div className="absolute -top-3 -left-3 flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-white rounded px-1 py-0.5 border border-emerald-200 shadow-sm">
          <Lock size={9} /> Locked
        </div>
      )}
      {geo.warning && (
        <div className="absolute top-1 left-1 text-[9px] font-semibold text-amber-700 bg-amber-50 border border-amber-300 rounded px-1 py-0.5">
          Bend too tight for locked length
        </div>
      )}
    </motion.div>
  );
}

// Build an SVG path "d" string from a list of {x,y} points.
function pathD(pts) {
  if (!pts.length) return "";
  return `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");
}
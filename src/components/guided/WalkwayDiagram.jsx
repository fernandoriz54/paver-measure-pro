import React, { useRef, useState, useCallback, useEffect } from "react";
import { DimLine, fmtLen, STATUS_COLOR } from "./GuidedDiagram";

// Walkway diagrams. Straight/tapered are static; the bend diagram is interactive
// with draggable bend handles and locked start/end anchors. Field area = measured
// centerline × average width stays authoritative regardless of bends.
export default function WalkwayDiagram({ diagram, values, highlight, onTapDimension, fieldStatus }) {
  const fs = fieldStatus || {};
  const tap = (k) => (onTapDimension ? () => onTapDimension(k) : undefined);
  const st = (k, hasVal) => (highlight === k ? "active" : fs[k] || (hasVal ? "needs_verification" : "missing"));
  const dim = (k) => !!highlight && highlight !== k;

  if (diagram === "walkwayStepping") return <SteppingView values={values} st={st} tap={tap} dim={dim} />;
  if (diagram === "walkwayBend") return <BendView values={values} st={st} tap={tap} dim={dim} />;

  // walkwayStraight or walkwayTapered
  const len = values.centerlineLength || 24;
  const widthsArr = Array.isArray(values.widths) && values.widths.length ? values.widths : (values.endWidth != null ? [values.startWidth || 0, values.endWidth || 0] : [values.startWidth || 4]);
  const aw = widthsArr.filter((w) => w > 0).reduce((a, b) => a + b, 0) / (widthsArr.filter((w) => w > 0).length || 1) || 4;
  const VB = 420, VH = 200, padX = 44, padY = 50;
  const s = Math.min((VB - padX * 2) / len, (VH - padY) / aw, 16);
  const x0 = padX, x1 = x0 + len * s, cy = VH / 2;
  const top = cy - (aw * s) / 2, bot = cy + (aw * s) / 2;

  // Build band polygon: for tapered, top/bottom vary linearly across stations.
  const stations = widthsArr.length;
  const topPts = [], botPts = [];
  for (let i = 0; i <= Math.max(1, stations - 1); i++) {
    const frac = stations > 1 ? i / (stations - 1) : i;
    const w = stations > 1 ? widthsArr[i] : aw;
    const x = x0 + frac * (x1 - x0);
    topPts.push(`${x},${cy - (w * s) / 2}`);
    botPts.push(`${x},${cy + (w * s) / 2}`);
  }
  const bandPts = [...topPts, ...botPts.reverse()].join(" ");

  return (
    <svg viewBox={`0 0 ${VB} ${VH}`} className="w-full h-auto bg-slate-50 rounded-xl border border-slate-200">
      <text x={VB / 2} y={14} textAnchor="middle" fontSize={10} fontWeight={700} fill="#475569">TOP VIEW</text>
      <polygon points={bandPts} fill="#bae6fd" stroke="#0284c7" strokeWidth={1.5} />
      <line x1={x0} y1={cy} x2={x1} y2={cy} stroke="#0284c7" strokeWidth={1} strokeDasharray="4 3" />
      <DimLine x1={x0} y1={bot + 22} x2={x1} y2={bot + 22} label={`Length ${fmtLen(len)}`} status={st("length", !!values.centerlineLength)} dim={dim("length")} onTap={tap("centerlineLength")} />
      <DimLine x1={x0 - 26} y1={top} x2={x0 - 26} y2={bot} label={`W ${fmtLen(widthsArr[0])}`} status={st("width", !!values.startWidth)} dim={dim("width")} onTap={tap("startWidth")} />
      {values.endWidth != null && <DimLine x1={x1 + 12} y1={cy - (widthsArr[widthsArr.length - 1] * s) / 2} x2={x1 + 12} y2={cy + (widthsArr[widthsArr.length - 1] * s) / 2} label={`W ${fmtLen(widthsArr[widthsArr.length - 1])}`} status={st("endWidth", !!values.endWidth)} dim={dim("endWidth")} onTap={tap("endWidth")} />}
      <text x={VB / 2} y={VH - 6} textAnchor="middle" fontSize={9} fill="#64748b">Field area = {fmtLen(len)} × {fmtLen(aw)} = {fmtLen(len * aw).replace(/\.?\d+$/, "") || (len * aw).toFixed(0)} sq ft</text>
    </svg>
  );
}

function BendView({ values, st, tap, dim }) {
  const len = values.centerlineLength || 30;
  const w = values.startWidth || 4;
  const VB = 420, VH = 240, padX = 50, padY = 50;
  const s = Math.min((VB - padX * 2) / len, (VH - padY) / w, 10);
  const x0 = padX, x1 = x0 + len * s, cy = VH / 2;
  const svgRef = useRef(null);
  const [handles, setHandles] = useState([{ x: (x0 + x1) / 2, y: cy - 40 }]);
  const [drag, setDrag] = useState(null);

  const toSvg = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  const onHandleDown = (i) => (e) => { e.stopPropagation(); setDrag(i); };
  const onMove = useCallback((e) => {
    if (drag == null) return;
    const p = toSvg(e.clientX, e.clientY);
    setHandles((h) => h.map((hd, i) => (i === drag ? { x: Math.max(x0 + 8, Math.min(x1 - 8, p.x)), y: Math.max(padY, Math.min(VH - padY, p.y)) } : hd)));
  }, [drag]);
  const onUp = useCallback(() => setDrag(null), []);
  useEffect(() => {
    if (drag == null) return;
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [drag, onMove, onUp]);

  const addHandle = (e) => {
    const p = toSvg(e.clientX, e.clientY);
    setHandles((h) => [...h, { x: Math.max(x0 + 8, Math.min(x1 - 8, p.x)), y: Math.max(padY, Math.min(VH - padY, p.y)) }].sort((a, b) => a.x - b.x));
  };
  const removeHandle = (i) => () => setHandles((h) => h.filter((_, idx) => idx !== i));

  const pts = [{ x: x0, y: cy }, ...handles, { x: x1, y: cy }];
  const centerline = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const strokeWidth = Math.max(4, w * s);

  return (
    <svg ref={svgRef} viewBox={`0 0 ${VB} ${VH}`} className="w-full h-auto bg-slate-50 rounded-xl border border-slate-200 touch-none">
      <text x={VB / 2} y={14} textAnchor="middle" fontSize={10} fontWeight={700} fill="#475569">CURVED PATH — TOP VIEW</text>
      <g onClick={addHandle} style={{ cursor: "copy" }}>
        <polyline points={centerline} fill="none" stroke="#bae6fd" strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={centerline} fill="none" stroke="#0284c7" strokeWidth={1} strokeDasharray="5 4" />
      </g>
      {/* locked anchors */}
      <circle cx={x0} cy={cy} r={7} fill="#0f766e" stroke="#fff" strokeWidth={2} />
      <circle cx={x1} cy={cy} r={7} fill="#0f766e" stroke="#fff" strokeWidth={2} />
      <text x={x0} y={cy - 14} textAnchor="middle" fontSize={8} fill="#0f766e">start (locked)</text>
      <text x={x1} y={cy - 14} textAnchor="middle" fontSize={8} fill="#0f766e">end (locked)</text>
      {/* draggable bend handles */}
      {handles.map((h, i) => (
        <g key={i} onPointerDown={onHandleDown(i)} onDoubleClick={removeHandle(i)} style={{ cursor: "grab" }}>
          <circle cx={h.x} cy={h.y} r={9} fill="#fcd34d" stroke="#b45309" strokeWidth={2} />
          <circle cx={h.x} cy={h.y} r={2} fill="#b45309" />
        </g>
      ))}
      <DimLine x1={x0} y1={VH - 14} x2={x1} y2={VH - 14} label={`Centerline ${fmtLen(len)}`} status={st("length", !!values.centerlineLength)} dim={dim("length")} onTap={tap("centerlineLength")} />
      <DimLine x1={x0 - 22} y1={cy - w * s / 2} x2={x0 - 22} y2={cy + w * s / 2} label={`W ${fmtLen(w)}`} status={st("width", !!values.startWidth)} dim={dim("width")} onTap={tap("startWidth")} />
      <text x={VB / 2} y={VH - 26} textAnchor="middle" fontSize={9} fill="#64748b">Field area = {fmtLen(len)} × {fmtLen(w)} = {(len * w).toFixed(0)} sq ft (authoritative)</text>
      <text x={8} y={VH - 4} fontSize={8} fill="#94a3b8">Tap path to add a bend · double-tap a handle to remove</text>
    </svg>
  );
}

function SteppingView({ values, st, tap, dim }) {
  const VB = 420, VH = 220, padX = 36, padY = 40;
  const slabL = (values.slabLengthIn || 24) / 12, slabW = (values.width ? 0 : 0);
  const count = Math.max(1, Math.round(values.count || 6));
  const gap = (values.gapIn || 3) / 12;
  const rows = Math.max(1, Math.round(values.rows || 1));
  const slabWidthFt = (values.slabWidthIn || 24) / 12;
  const run = count * (slabL + gap);
  const s = Math.min((VB - padX * 2) / run, (VH - padY) / (rows * slabWidthFt + (rows - 1) * 0.5), 14);
  const x0 = padX, y0 = padY;
  const slabs = [];
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < count; i++) {
      const x = x0 + i * (slabL + gap) * s;
      const y = y0 + r * (slabWidthFt + 0.5) * s;
      slabs.push({ x, y, w: slabL * s, h: slabWidthFt * s, key: `${r}-${i}` });
    }
  }
  return (
    <svg viewBox={`0 0 ${VB} ${VH}`} className="w-full h-auto bg-slate-50 rounded-xl border border-slate-200">
      <text x={VB / 2} y={14} textAnchor="middle" fontSize={10} fontWeight={700} fill="#475569">STEPPING SLABS — TOP VIEW</text>
      {slabs.map((sl) => (
        <rect key={sl.key} x={sl.x} y={sl.y} width={sl.w} height={sl.h} fill="#e2e8f0" stroke="#475569" strokeWidth={1.4} rx={2} />
      ))}
      <DimLine x1={x0} y1={y0 + rows * slabWidthFt * s + 18} x2={x0 + run * s} y2={y0 + rows * slabWidthFt * s + 18} label={`Run ${fmtLen(run)}`} status={st("length", !!values.count)} dim={dim("slabLength")} onTap={tap("slabLengthIn")} />
      <DimLine x1={x0 - 22} y1={y0} x2={x0 - 22} y2={y0 + slabWidthFt * s} label={`${values.slabLengthIn || 24}"`} status={st("slabLength", !!values.slabLengthIn)} dim={dim("slabLength")} onTap={tap("slabLengthIn")} />
    </svg>
  );
}
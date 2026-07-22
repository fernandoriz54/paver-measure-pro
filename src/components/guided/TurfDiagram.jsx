import React from "react";
import { DimLine, fmtLen, STATUS_COLOR } from "./GuidedDiagram";

// Turf diagrams: rectangle, deductions, tree wells.
export default function TurfDiagram({ diagram, values, highlight, onTapDimension, fieldStatus }) {
  const fs = fieldStatus || {};
  const tap = (k) => (onTapDimension ? () => onTapDimension(k) : undefined);
  const st = (k, hasVal) => (highlight === k ? "active" : fs[k] || (hasVal ? "needs_verification" : "missing"));
  const dim = (k) => !!highlight && highlight !== k;
  const VB = 420, pad = 40;
  const len = values.length || 20, wid = values.width || 15;
  const s = Math.min((VB - pad * 2) / len, (VB - pad * 2 - 40) / wid, 18);
  const x0 = pad, y0 = pad + 10, x1 = x0 + len * s, y1 = y0 + wid * s;

  if (diagram === "turfTreeWells") {
    const count = Math.round(values.treeWellCount || 2), d = values.treeWellDiameter || 4;
    const wells = Array.from({ length: count }, (_, i) => {
      const cx = x0 + (len * s) * ((i + 1) / (count + 1));
      const cy = y0 + wid * s / 2;
      return { cx, cy, r: (d * s) / 2 };
    });
    return (
      <svg viewBox={`0 0 ${VB} ${VB}`} className="w-full h-auto bg-emerald-50 rounded-xl border border-emerald-200">
        <text x={VB / 2} y={14} textAnchor="middle" fontSize={10} fontWeight={700} fill="#166534">TURF WITH TREE WELLS</text>
        <rect x={x0} y={y0} width={len * s} height={wid * s} fill="#bbf7d0" stroke="#15803d" strokeWidth={1.5} />
        {wells.map((w, i) => (
          <g key={i} onClick={tap("treeWellDiameter")} style={tap ? { cursor: "pointer" } : undefined}>
            <circle cx={w.cx} cy={w.cy} r={w.r} fill="#f5d0fe" stroke={STATUS_COLOR.deduction} strokeWidth={1.5} strokeDasharray="4 3" />
          </g>
        ))}
        <DimLine x1={x0} y1={y1 + 22} x2={x1} y2={y1 + 22} label={`L ${fmtLen(len)}`} status={st("length", !!values.length)} dim={dim("length")} onTap={tap("length")} />
        <DimLine x1={x0 - 24} y1={y0} x2={x0 - 24} y2={y1} label={`W ${fmtLen(wid)}`} status={st("width", !!values.width)} dim={dim("width")} onTap={tap("width")} />
        <text x={VB / 2} y={VB - 8} textAnchor="middle" fontSize={9} fill="#166534">{count} tree well(s) · Ø {fmtLen(d)}</text>
      </svg>
    );
  }

  // turfRect / turfDeduct
  const hasDeduct = diagram === "turfDeduct" || values.planters || values.existingConcrete;
  return (
    <svg viewBox={`0 0 ${VB} ${VB}`} className="w-full h-auto bg-emerald-50 rounded-xl border border-emerald-200">
      <text x={VB / 2} y={14} textAnchor="middle" fontSize={10} fontWeight={700} fill="#166534">TURF AREA — PLAN VIEW</text>
      <rect x={x0} y={y0} width={len * s} height={wid * s} fill="#bbf7d0" stroke="#15803d" strokeWidth={1.5} />
      {hasDeduct && (
        <>
          <rect x={x0 + len * s * 0.6} y={y0 + 6} width={len * s * 0.28} height={wid * s * 0.3} fill="#f5d0fe" stroke={STATUS_COLOR.deduction} strokeWidth={1.4} strokeDasharray="4 3" />
          <rect x={x0 + 6} y={y0 + wid * s * 0.6} width={len * s * 0.3} height={wid * s * 0.28} fill="#fef3c7" stroke={STATUS_COLOR.deduction} strokeWidth={1.4} strokeDasharray="4 3" />
        </>
      )}
      <DimLine x1={x0} y1={y1 + 22} x2={x1} y2={y1 + 22} label={`L ${fmtLen(len)}`} status={st("length", !!values.length)} dim={dim("length")} onTap={tap("length")} />
      <DimLine x1={x0 - 24} y1={y0} x2={x0 - 24} y2={y1} label={`W ${fmtLen(wid)}`} status={st("width", !!values.width)} dim={dim("width")} onTap={tap("width")} />
    </svg>
  );
}
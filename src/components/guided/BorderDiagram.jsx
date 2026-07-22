import React from "react";
import { DimLine, fmtLen, STATUS_COLOR } from "./GuidedDiagram";

// Border diagrams: running/double (linear), circular (ring).
export default function BorderDiagram({ diagram, values, highlight, onTapDimension, fieldStatus }) {
  const fs = fieldStatus || {};
  const tap = (k) => (onTapDimension ? () => onTapDimension(k) : undefined);
  const st = (k, hasVal) => (highlight === k ? "active" : fs[k] || (hasVal ? "needs_verification" : "missing"));
  const dim = (k) => !!highlight && highlight !== k;

  if (diagram === "borderCircular") {
    const id = values.innerDiameter || 6, od = values.outerDiameter || 8;
    const VB = 300, c = VB / 2, pad = 30;
    const s = (VB / 2 - pad) / (od / 2);
    const ri = (id / 2) * s, ro = (od / 2) * s;
    return (
      <svg viewBox={`0 0 ${VB} ${VB}`} className="w-full h-auto bg-slate-50 rounded-xl border border-slate-200">
        <text x={VB / 2} y={16} textAnchor="middle" fontSize={10} fontWeight={700} fill="#475569">CIRCULAR BORDER</text>
        <circle cx={c} cy={c} r={ro} fill="#e2e8f0" stroke="#475569" strokeWidth={1.5} />
        <circle cx={c} cy={c} r={ri} fill="#f8fafc" stroke={STATUS_COLOR.deduction} strokeWidth={1.4} strokeDasharray="4 3" />
        <DimLine x1={c - ro} y1={c} x2={c + ro} y2={c} label={`Ø out ${fmtLen(od)}`} status={st("outer", !!values.outerDiameter)} dim={dim("outer")} onTap={tap("outerDiameter")} />
        <DimLine x1={c} y1={c + ri + 14} x2={c} y2={c - ri - 14} label={`Ø in ${fmtLen(id)}`} status={st("inner", !!values.innerDiameter)} dim={dim("inner")} onTap={tap("innerDiameter")} />
      </svg>
    );
  }

  // borderRun / borderDouble
  const run = values.totalRun || 60, bw = values.borderWidth || 8, rows = values.rows || 1;
  const VB = 420, VH = 200, padX = 40, padY = 60;
  const s = Math.min((VB - padX * 2) / run, (VH - padY) / (bw * rows / 12 + 1), 8);
  const x0 = padX, x1 = x0 + run * s, cy = VH / 2;
  const bandH = (bw * rows / 12) * s;
  const noBorder = values.noBorderEdges || 0;
  const shared = values.sharedEdges || 0;
  const drawEnd = x1 - noBorder * s;
  const sharedStart = x1 - (noBorder + shared) * s;
  return (
    <svg viewBox={`0 0 ${VB} ${VH}`} className="w-full h-auto bg-slate-50 rounded-xl border border-slate-200">
      <text x={VB / 2} y={16} textAnchor="middle" fontSize={10} fontWeight={700} fill="#475569">BORDER — PLAN</text>
      {/* field edge */}
      <line x1={x0} y1={cy - bandH / 2 - 8} x2={x1} y2={cy - bandH / 2 - 8} stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" />
      <rect x={x0} y={cy - bandH / 2} width={drawEnd - x0} height={bandH} fill="#e2e8f0" stroke="#475569" strokeWidth={1.4} />
      {rows === 2 && <line x1={x0} y1={cy} x2={drawEnd} y2={cy} stroke="#94a3b8" strokeWidth={0.8} />}
      {shared > 0 && (
        <rect x={sharedStart} y={cy - bandH / 2} width={shared * s} height={bandH} fill="#f5d0fe" stroke={STATUS_COLOR.deduction} strokeWidth={1.2} strokeDasharray="4 3" />
      )}
      {noBorder > 0 && (
        <rect x={drawEnd} y={cy - bandH / 2} width={noBorder * s} height={bandH} fill="#f1f5f9" stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3 3" />
      )}
      <DimLine x1={x0} y1={cy + bandH / 2 + 18} x2={x1} y2={cy + bandH / 2 + 18} label={`Run ${fmtLen(run)}`} status={st("run", !!values.totalRun)} dim={dim("run")} onTap={tap("totalRun")} />
      <DimLine x1={x0 - 22} y1={cy - bandH / 2} x2={x0 - 22} y2={cy + bandH / 2} label={`W ${bw}"`} status={st("borderWidth", !!values.borderWidth)} dim={dim("run")} onTap={tap("borderWidth")} />
      <text x={VB / 2} y={VH - 6} textAnchor="middle" fontSize={9} fill="#64748b">{rows} row(s) {shared ? `· ${fmtLen(shared)} shared excluded` : ""} {noBorder ? `· ${fmtLen(noBorder)} no-border` : ""}</text>
    </svg>
  );
}
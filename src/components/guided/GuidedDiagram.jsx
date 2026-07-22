import React from "react";
import StepsDiagram from "./StepsDiagram";
import WallDiagram from "./WallDiagram";

// Format a decimal-feet length as ft/in for diagram labels.
export function fmtLen(ft) {
  if (ft == null || isNaN(ft)) return "";
  const f = Math.floor(ft);
  const inRaw = Math.round((ft - f) * 12);
  const inches = inRaw === 12 ? 0 : inRaw;
  if (f === 0) return `${inches}"`;
  if (inches === 0) return `${f}'`;
  return `${f}' ${inches}"`;
}

// Status → color. Blue: measuring, Green: verified, Amber: needs verification,
// Red: missing, Gray: calculated, Purple: deduction.
export const STATUS_COLOR = {
  active: "#2563eb",
  verified: "#059669",
  needs_verification: "#d97706",
  missing: "#dc2626",
  calculated: "#64748b",
  deduction: "#7c3aed",
};

// Dimension line with arrowheads at both ends + optional label pill.
// status: one of STATUS_COLOR keys; active: legacy boolean (treats as 'active').
// onTap: optional callback fired when the dimension is tapped (opens its input).
export function DimLine({ x1, y1, x2, y2, label, active, status, onTap, dim = false }) {
  const color = status ? STATUS_COLOR[status] : active ? STATUS_COLOR.active : "#94a3b8";
  const sw = status || active ? 2.6 : 1.4;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const ah = 6;
  const back = ang + Math.PI;
  const lx = (x1 + x2) / 2;
  const ly = (y1 + y2) / 2;
  const opacity = dim ? 0.32 : 1;
  return (
    <g
      opacity={opacity}
      onClick={onTap ? onTap : undefined}
      style={onTap ? { cursor: "pointer" } : undefined}
      role={onTap ? "button" : undefined}
    >
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth={sw} strokeLinecap="round"
        className={active || status === "active" ? "dim-active" : undefined}
      />
      <line x1={x1} y1={y1} x2={x1 + Math.cos(back - 0.45) * ah} y2={y1 + Math.sin(back - 0.45) * ah} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <line x1={x1} y1={y1} x2={x1 + Math.cos(back + 0.45) * ah} y2={y1 + Math.sin(back + 0.45) * ah} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <line x1={x2} y1={y2} x2={x2 - Math.cos(ang - 0.45) * ah} y2={y2 - Math.sin(ang - 0.45) * ah} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <line x1={x2} y1={y2} x2={x2 - Math.cos(ang + 0.45) * ah} y2={y2 - Math.sin(ang + 0.45) * ah} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {label && (
        <g transform={`translate(${lx} ${ly})`}>
          <rect x={-28} y={-10} width={56} height={20} rx={5} fill="#ffffff" stroke={color} strokeWidth={1} />
          <text textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600} fill="#0f172a">{label}</text>
        </g>
      )}
    </g>
  );
}

// Dispatcher: picks the right diagram component by the `diagram` key.
export default function GuidedDiagram({ diagram, values, highlight, onTapDimension, fieldStatus }) {
  if (!diagram) return null;
  const shared = { values, highlight, onTapDimension, fieldStatus };
  if (diagram.startsWith("steps") || diagram.startsWith("porch") || diagram.startsWith("cover") || diagram.startsWith("curvedStep")) {
    return <StepsDiagram {...shared} diagram={diagram} />;
  }
  if (diagram.startsWith("wall")) {
    return <WallDiagram {...shared} diagram={diagram} />;
  }
  return null;
}
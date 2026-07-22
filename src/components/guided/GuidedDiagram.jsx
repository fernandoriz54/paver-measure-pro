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

// Dimension line with arrowheads at both ends + optional label pill.
export function DimLine({ x1, y1, x2, y2, label, active }) {
  const stroke = active ? "#d97706" : "#94a3b8";
  const sw = active ? 2.4 : 1.4;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const ah = 6;
  const back = ang + Math.PI;
  const lx = (x1 + x2) / 2;
  const ly = (y1 + y2) / 2;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      <line x1={x1} y1={y1} x2={x1 + Math.cos(back - 0.45) * ah} y2={y1 + Math.sin(back - 0.45) * ah} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      <line x1={x1} y1={y1} x2={x1 + Math.cos(back + 0.45) * ah} y2={y1 + Math.sin(back + 0.45) * ah} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      <line x1={x2} y1={y2} x2={x2 - Math.cos(ang - 0.45) * ah} y2={y2 - Math.sin(ang - 0.45) * ah} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      <line x1={x2} y1={y2} x2={x2 - Math.cos(ang + 0.45) * ah} y2={y2 - Math.sin(ang + 0.45) * ah} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      {label && (
        <g transform={`translate(${lx} ${ly})`}>
          <rect x={-26} y={-10} width={52} height={20} rx={5} fill="#ffffff" stroke={stroke} strokeWidth={1} />
          <text textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={active ? 700 : 500} fill="#0f172a">{label}</text>
        </g>
      )}
    </g>
  );
}

// Dispatcher: picks the right diagram component by the `diagram` key.
export default function GuidedDiagram({ diagram, values, highlight }) {
  if (!diagram) return null;
  if (diagram.startsWith("steps") || diagram.startsWith("porch") || diagram.startsWith("cover") || diagram.startsWith("curvedStep")) {
    return <StepsDiagram diagram={diagram} values={values} highlight={highlight} />;
  }
  if (diagram.startsWith("wall")) {
    return <WallDiagram diagram={diagram} values={values} highlight={highlight} />;
  }
  return null;
}
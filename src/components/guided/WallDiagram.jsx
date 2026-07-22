import React from "react";
import { DimLine, fmtLen } from "./GuidedDiagram";

// Construction-style wall diagrams. diagram key: wallElevation | wallPlan
export default function WallDiagram({ diagram, values, highlight, onTapDimension, fieldStatus }) {
  if (diagram === "wallPlan") return <WallPlan values={values} highlight={highlight} onTapDimension={onTapDimension} fieldStatus={fieldStatus} />;
  return <WallElevation values={values} highlight={highlight} onTapDimension={onTapDimension} fieldStatus={fieldStatus} />;
}

function WallElevation({ values, highlight, onTapDimension, fieldStatus }) {
  const fs = fieldStatus || {};
  const tap = (k) => (onTapDimension ? () => onTapDimension(k) : undefined);
  const status = (k) => (highlight === k ? "active" : fs[k] || "calculated");
  const dim = (k) => !!highlight && highlight !== k;

  const len = values.wallLength || 10;
  const h = values.wallHeight || 2;
  const VB_W = 420, VB_H = 240;
  const padL = 44, padR = 16, padT = 24, padB = 40;
  const availW = VB_W - padL - padR, availH = VB_H - padT - padB;
  const s = Math.min(availW / Math.max(len, 1), availH / Math.max(h, 1), 60);
  const x0 = padL, baseY = VB_H - padB, topY = baseY - h * s, endX = x0 + len * s;

  const courses = values.courses ? Math.round(values.courses) : 0;
  const courseLines = [];
  if (courses > 1) {
    for (let i = 1; i < courses; i++) {
      const cy = baseY - (h * s * i) / courses;
      courseLines.push(<line key={i} x1={x0} y1={cy} x2={endX} y2={cy} stroke="#cbd5e1" strokeWidth={0.8} />);
    }
  }

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto bg-slate-50 rounded-xl border border-slate-200">
      <text x={VB_W / 2} y={14} textAnchor="middle" fontSize={10} fontWeight={700} fill="#475569">ELEVATION (FRONT)</text>
      <rect x={x0} y={topY} width={len * s} height={h * s} fill="#e2e8f0" stroke="#475569" strokeWidth={1.5} />
      {courseLines}
      <rect x={x0 - 2} y={topY - 6} width={len * s + 4} height={6} fill="#fcd34d" stroke="#b45309" strokeWidth={1} />
      <text x={endX + 4} y={topY - 2} fontSize={9} fill="#92400e">cap</text>

      <DimLine x1={x0} y1={baseY + 24} x2={endX} y2={baseY + 24} label={`Length ${fmtLen(len)}`} status={status("wallLength")} dim={dim("wallLength")} onTap={tap("wallLength")} />
      <line x1={x0} y1={baseY} x2={x0} y2={baseY + 24} stroke="#cbd5e1" strokeWidth={0.8} />
      <line x1={endX} y1={baseY} x2={endX} y2={baseY + 24} stroke="#cbd5e1" strokeWidth={0.8} />

      <DimLine x1={x0 - 26} y1={baseY} x2={x0 - 26} y2={topY} label={`Ht ${fmtLen(h)}`} status={status("wallHeight")} dim={dim("wallHeight")} onTap={tap("wallHeight")} />
      <line x1={x0} y1={baseY} x2={x0 - 26} y2={baseY} stroke="#cbd5e1" strokeWidth={0.8} />
      <line x1={x0} y1={topY} x2={x0 - 26} y2={topY} stroke="#cbd5e1" strokeWidth={0.8} />

      <circle cx={x0} cy={baseY} r={4} fill={fs.exposedEnds ? "#059669" : "#0f766e"} />
      <circle cx={endX} cy={baseY} r={4} fill={fs.exposedEnds ? "#059669" : "#0f766e"} />
      <text x={x0 - 6} y={baseY + 14} fontSize={9} fill="#0f766e">end</text>
      <text x={endX - 2} y={baseY + 14} fontSize={9} fill="#0f766e">end</text>
    </svg>
  );
}

function WallPlan({ values, highlight, onTapDimension, fieldStatus }) {
  const tap = onTapDimension ? () => onTapDimension("segments") : undefined;
  const segs = values.segments && values.segments.length
    ? values.segments
    : values.wallLength
    ? [{ length: values.wallLength, height: values.wallHeight || 0 }]
    : [{ length: 10, height: 2 }];
  const n = segs.length;
  const VB = 420, cx = VB / 2, cy = VB / 2;
  const maxLen = Math.max(...segs.map((s) => s.length || 0), 1);
  const s = Math.min(150 / maxLen, 40);

  const pts = [];
  let x = cx - (n * 30), y = cy + 40, ang = 0;
  pts.push([x, y]);
  for (let i = 0; i < n; i++) {
    x += Math.cos(ang) * (segs[i].length || 0) * s;
    y += Math.sin(ang) * (segs[i].length || 0) * s;
    pts.push([x, y]);
    ang += Math.PI / 2;
  }

  return (
    <svg viewBox={`0 0 ${VB} ${VB}`} className="w-full h-auto bg-slate-50 rounded-xl border border-slate-200">
      <text x={VB / 2} y={16} textAnchor="middle" fontSize={10} fontWeight={700} fill="#475569">PLAN (TOP VIEW)</text>
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="#475569" strokeWidth={10} strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="#fcd34d" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r={5} fill={i === 0 || i === pts.length - 1 ? "#0f766e" : "#d97706"} />
          {i > 0 && (
            <g onClick={tap} style={tap ? { cursor: "pointer" } : undefined} role={tap ? "button" : undefined}>
              <rect x={(pts[i - 1][0] + p[0]) / 2 - 26} y={(pts[i - 1][1] + p[1]) / 2 - 18} width={52} height={16} rx={4} fill="#fff" stroke="#94a3b8" strokeWidth={0.8} />
              <text x={(pts[i - 1][0] + p[0]) / 2} y={(pts[i - 1][1] + p[1]) / 2 - 7} textAnchor="middle" fontSize={10} fill="#0f172a" fontWeight={600}>
                {fmtLen(segs[i - 1].length)}
              </text>
            </g>
          )}
        </g>
      ))}
      <text x={10} y={VB - 10} fontSize={9} fill="#64748b">● end  ● shared corner  — cap (yellow)</text>
    </svg>
  );
}
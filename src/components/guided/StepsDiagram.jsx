import React from "react";
import { DimLine, fmtLen } from "./GuidedDiagram";

// Construction-style side + front view of stairs.
// values (decimal feet): numSteps, treadDepth, riserHeight, stepWidth, landingDepth, numLandings
// onTapDimension(highlightKey) opens that input; fieldStatus[key] sets the color.
export default function StepsDiagram({ diagram, values, highlight, onTapDimension, fieldStatus }) {
  const fs = fieldStatus || {};
  const tap = (k) => (onTapDimension ? () => onTapDimension(k) : undefined);
  const status = (k, fallback = "calculated") => (highlight === k ? "active" : fs[k] || fallback);
  const dim = (k) => !!highlight && highlight !== k;

  const numSteps = Math.max(1, Math.round(values.numSteps || 3));
  const tread = values.treadDepth || 1;
  const riser = values.riserHeight || 0.667;
  const width = values.stepWidth || 6;
  const landingDepth = values.landingDepth || 0;
  const numLandings = values.numLandings || 0;

  const totalRun = tread * numSteps;
  const totalRise = riser * numSteps;
  const landingRun = landingDepth * numLandings;

  const VB_W = 420;
  const VB_H = 280;
  const padL = 44, padR = 16, padT = 24, padB = 40;
  const availW = VB_W - padL - padR;
  const availH = VB_H - padT - padB;
  const drawW = Math.max(totalRun + landingRun, 1);
  const drawH = Math.max(totalRise, riser, 0.1);
  const s = Math.min(availW / drawW, availH / drawH, 70);

  const x0 = padL;
  const baseY = VB_H - padB;
  const topY = baseY - totalRise * s;

  let x = x0, y = baseY;
  const pts = [[x, y]];
  for (let i = 0; i < numSteps; i++) {
    x += tread * s; pts.push([x, y]);
    y -= riser * s; pts.push([x, y]);
  }
  if (landingRun > 0) { x += landingRun * s; pts.push([x, y]); }
  pts.push([x, baseY]); pts.push([x0, baseY]);
  const poly = pts.map((p) => p.join(",")).join(" ");
  const endX = x;

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto bg-slate-50 rounded-xl border border-slate-200">
      <polygon points={poly} fill="#e2e8f0" stroke="#475569" strokeWidth={1.5} strokeLinejoin="round" />
      {(() => {
        const lines = [];
        let lx = x0, ly = baseY;
        for (let i = 0; i < numSteps; i++) {
          lx += tread * s;
          lines.push(<line key={`t${i}`} x1={lx - tread * s} y1={ly} x2={lx} y2={ly} stroke="#334155" strokeWidth={1.2} />);
          ly -= riser * s;
          lines.push(<line key={`r${i}`} x1={lx} y1={ly + riser * s} x2={lx} y2={ly} stroke="#334155" strokeWidth={1.2} />);
        }
        return lines;
      })()}

      <DimLine x1={x0} y1={baseY + 26} x2={endX} y2={baseY + 26} label={`Run ${fmtLen(totalRun)}`} status={status("run")} dim={dim("run")} onTap={tap("treadDepth")} />
      <line x1={x0} y1={baseY} x2={x0} y2={baseY + 26} stroke="#cbd5e1" strokeWidth={0.8} />
      <line x1={endX} y1={baseY} x2={endX} y2={baseY + 26} stroke="#cbd5e1" strokeWidth={0.8} />

      <DimLine x1={x0 - 26} y1={baseY} x2={x0 - 26} y2={topY} label={`Rise ${fmtLen(totalRise)}`} status={status("rise")} dim={dim("rise")} onTap={tap("riserHeight")} />
      <line x1={x0} y1={baseY} x2={x0 - 26} y2={baseY} stroke="#cbd5e1" strokeWidth={0.8} />
      <line x1={x0} y1={topY} x2={x0 - 26} y2={topY} stroke="#cbd5e1" strokeWidth={0.8} />

      {numSteps > 0 && (
        <DimLine x1={x0} y1={baseY - riser * s - 12} x2={x0 + tread * s} y2={baseY - riser * s - 12} label={`Tread ${fmtLen(tread)}`} status={status("treadDepth")} dim={dim("treadDepth")} onTap={tap("treadDepth")} />
      )}
      {numSteps > 0 && (
        <DimLine x1={x0 + tread * s + 12} y1={baseY} x2={x0 + tread * s + 12} y2={baseY - riser * s} label={`Riser ${fmtLen(riser)}`} status={status("riserHeight")} dim={dim("riserHeight")} onTap={tap("riserHeight")} />
      )}
      {landingRun > 0 && (
        <DimLine x1={x0 + totalRun * s} y1={topY - 12} x2={endX} y2={topY - 12} label={`Landing ${fmtLen(landingDepth)}`} status={status("landing")} dim={dim("landing")} onTap={tap("landing")} />
      )}

      <circle cx={x0} cy={baseY} r={4} fill="#d97706" />
      <text x={x0 - 6} y={baseY + 14} fontSize={9} fill="#92400e">bullnose</text>
      <text x={endX + 4} y={baseY} fontSize={9} fill="#64748b">↤ side return</text>

      <g transform="translate(300, 18)">
        <rect x={0} y={0} width={100} height={36} fill="#fef3c7" stroke="#d97706" strokeWidth={1.4} />
        <DimLine x1={0} y1={44} x2={100} y2={44} label={`Width ${fmtLen(width)}`} status={status("stepWidth")} dim={dim("stepWidth")} onTap={tap("stepWidth")} />
        <text x={50} y={20} textAnchor="middle" fontSize={9} fill="#92400e">FRONT VIEW</text>
      </g>

      <text x={VB_W / 2} y={14} textAnchor="middle" fontSize={10} fontWeight={700} fill="#475569">SIDE VIEW</text>
    </svg>
  );
}
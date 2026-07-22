import React from "react";
import { DimLine, fmtLen, STATUS_COLOR } from "./GuidedDiagram";

// Driveway diagrams: standard, tapered, apron, L/multi.
export default function DrivewayDiagram({ diagram, values, highlight, onTapDimension, fieldStatus }) {
  const fs = fieldStatus || {};
  const tap = (k) => (onTapDimension ? () => onTapDimension(k) : undefined);
  const st = (k, hasVal) => (highlight === k ? "active" : fs[k] || (hasVal ? "needs_verification" : "missing"));
  const dim = (k) => !!highlight && highlight !== k;
  const VB = 420, VH = 300, pad = 40;

  if (diagram === "drivewayL" || diagram === "drivewayMulti") return <MultiDrive values={values} st={st} tap={tap} dim={dim} fs={fs} highlight={highlight} />;
  if (diagram === "drivewayApron") {
    const gw = values.garageWidth || 16, depth = values.mainDepth || 20, al = values.apronLength || 6, aw = values.apronWidth || 22;
    const s = Math.min((VB - pad * 2) / Math.max(depth, aw), (VH - pad * 2) / aw, 12);
    const x0 = pad, y0 = pad + 10;
    const main = { x: x0, y: y0, w: depth * s, h: gw * s };
    const apron = { x: x0 + depth * s, y: y0 + (gw * s - aw * s) / 2, w: al * s, h: aw * s };
    return (
      <svg viewBox={`0 0 ${VB} ${VH}`} className="w-full h-auto bg-slate-50 rounded-xl border border-slate-200">
        <text x={VB / 2} y={14} textAnchor="middle" fontSize={10} fontWeight={700} fill="#475569">DRIVEWAY WITH APRON — PLAN</text>
        <rect x={main.x} y={main.y} width={main.w} height={main.h} fill="#e2e8f0" stroke="#475569" strokeWidth={1.5} />
        <rect x={apron.x} y={apron.y} width={apron.w} height={apron.h} fill="#fde68a" stroke="#b45309" strokeWidth={1.5} />
        <text x={main.x + main.w / 2} y={main.y + main.h / 2} textAnchor="middle" fontSize={11} fontWeight={700} fill="#475569">Main</text>
        <text x={apron.x + apron.w / 2} y={apron.y + apron.h / 2} textAnchor="middle" fontSize={11} fontWeight={700} fill="#92400e">Apron</text>
        <DimLine x1={main.x} y1={main.y - 16} x2={main.x + main.w} y2={main.y - 16} label={`Depth ${fmtLen(depth)}`} status={st("depth", !!values.mainDepth)} dim={dim("depth")} onTap={tap("mainDepth")} />
        <DimLine x1={main.x - 22} y1={main.y} x2={main.x - 22} y2={main.y + main.h} label={`Garage ${fmtLen(gw)}`} status={st("garageWidth", !!values.garageWidth)} dim={dim("garageWidth")} onTap={tap("garageWidth")} />
        <DimLine x1={apron.x} y1={apron.y + apron.h + 16} x2={apron.x + apron.w} y2={apron.y + apron.h + 16} label={`Apron ${fmtLen(al)}`} status={st("apronLength", !!values.apronLength)} dim={dim("apronLength")} onTap={tap("apronLength")} />
      </svg>
    );
  }

  // drivewayStd or drivewayTapered
  const gw = values.garageWidth || 16, sw = values.streetWidth || gw, depth = values.mainDepth || 20;
  const tapered = diagram === "drivewayTapered";
  const s = Math.min((VB - pad * 2) / depth, (VH - pad * 2) / Math.max(gw, sw), 12);
  const x0 = pad, y0 = pad + 10;
  const x1 = x0 + depth * s;
  const gY0 = y0 + (Math.max(gw, sw) - gw) * s / 2;
  const sY0 = y0 + (Math.max(gw, sw) - sw) * s / 2;
  const band = tapered
    ? `${x0},${gY0} ${x1},${sY0} ${x1},${sY0 + sw * s} ${x0},${gY0 + gw * s}`
    : `${x0},${gY0} ${x1},${gY0} ${x1},${gY0 + gw * s} ${x0},${gY0 + gw * s}`;
  return (
    <svg viewBox={`0 0 ${VB} ${VH}`} className="w-full h-auto bg-slate-50 rounded-xl border border-slate-200">
      <text x={VB / 2} y={14} textAnchor="middle" fontSize={10} fontWeight={700} fill="#475569">{tapered ? "TAPERED DRIVEWAY — PLAN" : "DRIVEWAY — PLAN"}</text>
      <polygon points={band} fill="#e2e8f0" stroke="#475569" strokeWidth={1.5} />
      <text x={x0 + 8} y={gY0 + 14} fontSize={9} fill="#475569">Garage</text>
      <text x={x1 - 30} y={sY0 + 14} fontSize={9} fill="#475569">Street</text>
      <DimLine x1={x0 - 22} y1={gY0} x2={x0 - 22} y2={gY0 + gw * s} label={`Garage ${fmtLen(gw)}`} status={st("garageWidth", !!values.garageWidth)} dim={dim("garageWidth")} onTap={tap("garageWidth")} />
      {tapered && <DimLine x1={x1 + 12} y1={sY0} x2={x1 + 12} y2={sY0 + sw * s} label={`Street ${fmtLen(sw)}`} status={st("streetWidth", !!values.streetWidth)} dim={dim("streetWidth")} onTap={tap("streetWidth")} />}
      <DimLine x1={x0} y1={Math.max(gY0, sY0) + Math.max(gw, sw) * s + 16} x2={x1} y2={Math.max(gY0, sY0) + Math.max(gw, sw) * s + 16} label={`Depth ${fmtLen(depth)}`} status={st("depth", !!values.mainDepth)} dim={dim("depth")} onTap={tap("mainDepth")} />
    </svg>
  );
}

const DRV_FILLS = ["#cbd5e1", "#bae6fd", "#bbf7d0", "#fde68a"];
function MultiDrive({ values, st, tap, dim, fs, highlight }) {
  const secs = (values.sections || []).filter((s) => s);
  const n = secs.length || 2;
  const list = secs.length ? secs : Array.from({ length: n }, () => ({ length: 16, width: 12 }));
  const VB = 420, VH = 300, pad = 40;
  const totalLen = list.reduce((a, s) => a + (s.length || 0), 0) || 16;
  const maxW = Math.max(...list.map((s) => s.width || 0), 1);
  const s = Math.min((VB - pad * 2) / totalLen, (VH - pad * 2) / maxW, 12);
  const x0 = pad, baseY = pad + 10;
  let x = x0;
  const blocks = list.map((sec, i) => {
    const w = (sec.length || 0) * s, h = (sec.width || 0) * s;
    const blk = { i, x, y: baseY + (maxW - (sec.width || 0)) * s / 2, w, h, sec, label: String.fromCharCode(65 + i) };
    x += w;
    return blk;
  });
  return (
    <svg viewBox={`0 0 ${VB} ${VH}`} className="w-full h-auto bg-slate-50 rounded-xl border border-slate-200">
      <text x={VB / 2} y={14} textAnchor="middle" fontSize={10} fontWeight={700} fill="#475569">DRIVEWAY SECTIONS — PLAN</text>
      {blocks.map((b) => (
        <g key={b.i} onClick={tap("segments")} style={tap ? { cursor: "pointer" } : undefined}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={DRV_FILLS[b.i % DRV_FILLS.length]} stroke="#475569" strokeWidth={1.5} />
          <text x={b.x + b.w / 2} y={b.y + b.h / 2} textAnchor="middle" fontSize={16} fontWeight={800} fill="#0f172a">{b.label}</text>
          <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 14} textAnchor="middle" fontSize={9} fill="#475569">{fmtLen(b.sec.length || 0)} × {fmtLen(b.sec.width || 0)}</text>
        </g>
      ))}
    </svg>
  );
}
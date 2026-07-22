import React from "react";
import { DimLine, fmtLen, STATUS_COLOR } from "./GuidedDiagram";

// Patio diagrams: plan view, color-coded sections A/B/C, cutouts, circular feature.
export default function PatioDiagram({ diagram, values, highlight, onTapDimension, fieldStatus }) {
  const fs = fieldStatus || {};
  const tap = (k) => (onTapDimension ? () => onTapDimension(k) : undefined);
  const st = (k, hasVal) => (highlight === k ? "active" : fs[k] || (hasVal ? "needs_verification" : "missing"));
  const dim = (k) => !!highlight && highlight !== k;
  const VB = 420, pad = 36;

  if (diagram === "patioCutout") return <CutoutView values={values} st={st} tap={tap} dim={dim} />;
  if (diagram === "patioCircle") return <CircleView values={values} st={st} tap={tap} dim={dim} />;
  if (diagram === "patioL" || diagram === "patioU" || diagram === "patioMulti") return <MultiView values={values} diagram={diagram} st={st} tap={tap} dim={dim} fs={fs} highlight={highlight} />;

  // patioRect (also square)
  const len = values.length || 20, wid = values.width || 10;
  const s = Math.min((VB - pad * 2) / len, (VB - pad * 2 - 40) / wid, 18);
  const x0 = pad, y0 = pad + 10, x1 = x0 + len * s, y1 = y0 + wid * s;
  return (
    <svg viewBox={`0 0 ${VB} ${VB}`} className="w-full h-auto bg-slate-50 rounded-xl border border-slate-200">
      <text x={VB / 2} y={14} textAnchor="middle" fontSize={10} fontWeight={700} fill="#475569">PLAN VIEW</text>
      <rect x={x0} y={y0} width={len * s} height={wid * s} fill="#e2e8f0" stroke="#475569" strokeWidth={1.5} />
      <DimLine x1={x0} y1={y1 + 22} x2={x1} y2={y1 + 22} label={`L ${fmtLen(len)}`} status={st("length", !!values.length)} dim={dim("length")} onTap={tap("length")} />
      <DimLine x1={x0 - 24} y1={y0} x2={x0 - 24} y2={y1} label={`W ${fmtLen(wid)}`} status={st("width", !!values.width)} dim={dim("width")} onTap={tap("width")} />
      {values.diagonal && <DimLine x1={x0} y1={y0} x2={x1} y2={y1} label={`diag ${fmtLen(values.diagonal)}`} status={st("diagonal", true)} dim={dim("diagonal")} onTap={tap("diagonal")} />}
    </svg>
  );
}

function CutoutView({ values, st, tap, dim }) {
  const VB = 420, pad = 40;
  const len = values.length || 20, wid = values.width || 12, cl = values.cutoutLength || 4, cw = values.cutoutWidth || 3;
  const s = Math.min((VB - pad * 2) / len, (VB - pad * 2 - 40) / wid, 18);
  const x0 = pad, y0 = pad + 10, x1 = x0 + len * s, y1 = y0 + wid * s;
  const cx0 = (x0 + x1) / 2 - (cl * s) / 2, cy0 = (y0 + y1) / 2 - (cw * s) / 2;
  return (
    <svg viewBox={`0 0 ${VB} ${VB}`} className="w-full h-auto bg-slate-50 rounded-xl border border-slate-200">
      <text x={VB / 2} y={14} textAnchor="middle" fontSize={10} fontWeight={700} fill="#475569">PATIO WITH CUTOUT</text>
      <rect x={x0} y={y0} width={len * s} height={wid * s} fill="#e2e8f0" stroke="#475569" strokeWidth={1.5} />
      <rect x={cx0} y={cy0} width={cl * s} height={cw * s} fill="#f5d0fe" stroke={STATUS_COLOR.deduction} strokeWidth={1.5} strokeDasharray="4 3" />
      <DimLine x1={x0} y1={y1 + 22} x2={x1} y2={y1 + 22} label={`L ${fmtLen(len)}`} status={st("length", !!values.length)} dim={dim("length")} onTap={tap("length")} />
      <DimLine x1={x0 - 24} y1={y0} x2={x0 - 24} y2={y1} label={`W ${fmtLen(wid)}`} status={st("width", !!values.width)} dim={dim("width")} onTap={tap("width")} />
      <DimLine x1={cx0} y1={cy0 - 14} x2={cx0 + cl * s} y2={cy0 - 14} label={`cut ${fmtLen(cl)}`} status={st("cutout", !!values.cutoutLength)} dim={dim("cutout")} onTap={tap("cutoutLength")} />
    </svg>
  );
}

function CircleView({ values, st, tap, dim }) {
  const VB = 420, pad = 40;
  const len = values.length || 18, wid = values.width || 14, d = values.circleDiameter || 6;
  const s = Math.min((VB - pad * 2) / len, (VB - pad * 2 - 40) / wid, 18);
  const x0 = pad, y0 = pad + 10, x1 = x0 + len * s, y1 = y0 + wid * s;
  const cxe = (x0 + x1) / 2, cye = (y0 + y1) / 2, r = (d * s) / 2;
  const add = values.circleMode === "add";
  return (
    <svg viewBox={`0 0 ${VB} ${VB}`} className="w-full h-auto bg-slate-50 rounded-xl border border-slate-200">
      <text x={VB / 2} y={14} textAnchor="middle" fontSize={10} fontWeight={700} fill="#475569">PATIO WITH CIRCULAR FEATURE</text>
      <rect x={x0} y={y0} width={len * s} height={wid * s} fill="#e2e8f0" stroke="#475569" strokeWidth={1.5} />
      <circle cx={cxe} cy={cye} r={r} fill={add ? "#bae6fd" : "#f5d0fe"} stroke={add ? STATUS_COLOR.verified : STATUS_COLOR.deduction} strokeWidth={1.5} strokeDasharray={add ? "" : "4 3"} />
      <DimLine x1={x0} y1={y1 + 22} x2={x1} y2={y1 + 22} label={`L ${fmtLen(len)}`} status={st("length", !!values.length)} dim={dim("length")} onTap={tap("length")} />
      <DimLine x1={x0 - 24} y1={y0} x2={x0 - 24} y2={y1} label={`W ${fmtLen(wid)}`} status={st("width", !!values.width)} dim={dim("width")} onTap={tap("width")} />
      <DimLine x1={cxe - r} y1={cye + r + 12} x2={cxe + r} y2={cye + r + 12} label={`Ø ${fmtLen(d)}`} status={st("circle", !!values.circleDiameter)} dim={dim("circle")} onTap={tap("circleDiameter")} />
    </svg>
  );
}

const SECTION_FILLS = ["#bae6fd", "#bbf7d0", "#fde68a", "#ddd6fe", "#fbcfe8"];
function MultiView({ values, diagram, st, tap, dim, fs, highlight }) {
  const VB = 420, pad = 40;
  const secs = (values.sections || []).filter((s) => s);
  const n = secs.length || (diagram === "patioL" ? 2 : diagram === "patioU" ? 3 : 2);
  const list = secs.length ? secs : Array.from({ length: n }, () => ({ length: 12, width: 8 }));
  const maxW = Math.max(...list.map((s) => s.width || 0), 1);
  const totalLen = list.reduce((a, s) => a + (s.length || 0), 0) || 12;
  const s = Math.min((VB - pad * 2) / totalLen, (VB - pad * 2) / maxW, 16);
  const x0 = pad, baseY = pad + 10;
  let x = x0;
  const blocks = list.map((sec, i) => {
    const w = (sec.length || 0) * s, h = (sec.width || 0) * s;
    const blk = { i, x, y: baseY, w, h, sec, label: String.fromCharCode(65 + i) };
    x += w;
    return blk;
  });
  const stFor = (i) => highlight === "sections" && i === 0 ? "active" : fs.sections || (secs.length ? "needs_verification" : "missing");
  return (
    <svg viewBox={`0 0 ${VB} ${VB}`} className="w-full h-auto bg-slate-50 rounded-xl border border-slate-200">
      <text x={VB / 2} y={14} textAnchor="middle" fontSize={10} fontWeight={700} fill="#475569">SECTIONS (PLAN)</text>
      {blocks.map((b) => (
        <g key={b.i} onClick={tap("segments")} style={tap ? { cursor: "pointer" } : undefined}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={SECTION_FILLS[b.i % SECTION_FILLS.length]} stroke="#475569" strokeWidth={1.5} opacity={0.9} />
          <text x={b.x + b.w / 2} y={b.y + b.h / 2} textAnchor="middle" fontSize={16} fontWeight={800} fill="#0f172a">{b.label}</text>
          <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 14} textAnchor="middle" fontSize={9} fill="#475569">{fmtLen(b.sec.length || 0)} × {fmtLen(b.sec.width || 0)}</text>
        </g>
      ))}
      {blocks.map((b) => (
        <DimLine key={`d${b.i}`} x1={b.x} y1={b.y + b.h + 16} x2={b.x + b.w} y2={b.y + b.h + 16} label={`${b.label} ${fmtLen(b.sec.length || 0)}`} status={stFor(b.i)} dim={false} onTap={tap("segments")} />
      ))}
    </svg>
  );
}
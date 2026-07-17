import React from "react";
import { formatValue, decimalToFeetInches } from "@/lib/measurementUtils";

// Helper: format a decimal-feet dimension as e.g. "12'-4"" or "10.5'"
function dimLabel(val) {
  if (!val || val <= 0) return "";
  const { feet, inches } = decimalToFeetInches(val);
  if (inches === 0) return `${feet}'`;
  return `${feet}'-${inches}"`;
}

// Draw one section as a scaled SVG diagram with dimension labels.
function SectionDiagram({ section, computed }) {
  const { shape, measurements: m, label, name } = section;
  const area = computed?.area || 0;
  const perim = computed?.perimeter || 0;

  const PAD = 28;
  const BOX = 170; // drawable size target

  // Determine bounding dimensions (ft) and drawing
  let drawWidth = 0;
  let drawHeight = 0;
  let render = null;

  if (shape === "rectangle") {
    const l = m.lengthFt || 0;
    const w = m.widthFt || 0;
    const maxDim = Math.max(l, w, 1);
    const scale = BOX / maxDim;
    const rw = l * scale;
    const rh = w * scale;
    drawWidth = rw + PAD * 2;
    drawHeight = rh + PAD * 2;
    const x0 = (drawWidth - rw) / 2;
    const y0 = (drawHeight - rh) / 2;
    render = (
      <>
        <rect x={x0} y={y0} width={rw} height={rh} fill="#10b98122" stroke="#0f766e" strokeWidth={2} rx={3} />
        {/* length label (bottom) */}
        <line x1={x0} y1={y0 + rh + 14} x2={x0 + rw} y2={y0 + rh + 14} stroke="#475569" strokeWidth={1} />
        <text x={x0 + rw / 2} y={y0 + rh + 26} textAnchor="middle" fontSize="11" fill="#334155" fontWeight="600">
          L {dimLabel(l)}
        </text>
        {/* width label (left) */}
        <line x1={x0 - 14} y1={y0} x2={x0 - 14} y2={y0 + rh} stroke="#475569" strokeWidth={1} />
        <text x={x0 - 18} y={y0 + rh / 2} textAnchor="middle" fontSize="11" fill="#334155" fontWeight="600" transform={`rotate(-90 ${x0 - 18} ${y0 + rh / 2})`}>
          W {dimLabel(w)}
        </text>
      </>
    );
  } else if (shape === "circle") {
    const d = m.diameter || 0;
    const r = d / 2;
    const maxDim = Math.max(d, 1);
    const scale = BOX / maxDim;
    const rr = r * scale;
    drawWidth = rr * 2 + PAD * 2;
    drawHeight = rr * 2 + PAD * 2;
    const cx = drawWidth / 2;
    const cy = drawHeight / 2;
    render = (
      <>
        <circle cx={cx} cy={cy} r={rr} fill="#6366f122" stroke="#4338ca" strokeWidth={2} />
        <line x1={cx - rr} y1={cy} x2={cx + rr} y2={cy} stroke="#dc2626" strokeWidth={1.5} strokeDasharray="4 3" />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="11" fill="#334155" fontWeight="600">
          Ø {dimLabel(d)}
        </text>
      </>
    );
  } else if (shape === "triangle") {
    const b = m.baseFt || 0;
    const h = m.heightFt || 0;
    const maxDim = Math.max(b, h, 1);
    const scale = BOX / maxDim;
    const bw = b * scale;
    const hh = h * scale;
    drawWidth = bw + PAD * 2;
    drawHeight = hh + PAD * 2;
    const x0 = (drawWidth - bw) / 2;
    const y0 = (drawHeight - hh) / 2 + PAD / 2;
    render = (
      <>
        <polygon points={`${x0},${y0 + hh} ${x0 + bw},${y0 + hh} ${x0 + bw / 2},${y0}`} fill="#14b8a622" stroke="#0d9488" strokeWidth={2} />
        <text x={x0 + bw / 2} y={y0 + hh + 24} textAnchor="middle" fontSize="11" fill="#334155" fontWeight="600">
          Base {dimLabel(b)}
        </text>
        <text x={x0 + bw + 14} y={y0 + hh / 2} textAnchor="middle" fontSize="11" fill="#334155" fontWeight="600" transform={`rotate(-90 ${x0 + bw + 14} ${y0 + hh / 2})`}>
          H {dimLabel(h)}
        </text>
      </>
    );
  } else if (shape === "trapezoid") {
    const a = m.sideA || 0;
    const b = m.sideB || 0;
    const h = m.heightFt || 0;
    const maxDim = Math.max(a, b, h, 1);
    const scale = BOX / maxDim;
    const aw = a * scale;
    const bw = b * scale;
    const hh = h * scale;
    const tw = Math.max(aw, bw);
    drawWidth = tw + PAD * 2;
    drawHeight = hh + PAD * 2;
    const cx = drawWidth / 2;
    const y0 = (drawHeight - hh) / 2;
    render = (
      <>
        <polygon points={`${cx - aw / 2},${y0} ${cx + aw / 2},${y0} ${cx + bw / 2},${y0 + hh} ${cx - bw / 2},${y0 + hh}`} fill="#f59e0b22" stroke="#b45309" strokeWidth={2} />
        <text x={cx} y={y0 - 8} textAnchor="middle" fontSize="11" fill="#334155" fontWeight="600">
          A {dimLabel(a)}
        </text>
        <text x={cx} y={y0 + hh + 22} textAnchor="middle" fontSize="11" fill="#334155" fontWeight="600">
          B {dimLabel(b)}
        </text>
        <text x={cx + tw / 2 + 14} y={y0 + hh / 2} textAnchor="middle" fontSize="11" fill="#334155" fontWeight="600" transform={`rotate(-90 ${cx + tw / 2 + 14} ${y0 + hh / 2})`}>
          H {dimLabel(h)}
        </text>
      </>
    );
  } else {
    drawWidth = BOX + PAD * 2;
    drawHeight = BOX / 2 + PAD;
    render = (
      <text x={drawWidth / 2} y={drawHeight / 2} textAnchor="middle" fontSize="11" fill="#94a3b8">
        Enter measurements
      </text>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col items-center">
      <div className="flex items-center gap-2 self-stretch mb-1">
        <span className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-bold text-sm flex items-center justify-center">{label}</span>
        <span className="font-semibold text-slate-800 text-sm truncate flex-1">{name || "Untitled"}</span>
        <span className="text-xs text-slate-400 capitalize">{shape}</span>
      </div>
      <svg width={drawWidth} height={drawHeight} className="max-w-full">
        {render}
      </svg>
      <div className="flex gap-3 mt-1 text-xs">
        <span className="text-slate-600">Area: <strong className="text-emerald-700">{formatValue(area, "hundredth")}</strong> sf</span>
        {perim > 0 && <span className="text-slate-600">Perim: <strong>{formatValue(perim, "hundredth")}</strong> lf</span>}
      </div>
    </div>
  );
}

export default function LayoutPlan({ sections, computedMap }) {
  if (!sections.length) {
    return (
      <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
        Add sections to see the layout plan
      </div>
    );
  }
  return (
    <div>
      <h3 className="text-sm font-bold text-slate-700 mb-2 px-1">📐 Layout Plan (drawn to scale)</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sections.map((s) => (
          <SectionDiagram key={s.id} section={s} computed={computedMap[s.id]} />
        ))}
      </div>
    </div>
  );
}
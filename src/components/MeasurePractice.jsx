import React, { useMemo, useState } from "react";
import { Dumbbell, Check, X, RotateCcw, ArrowRight } from "lucide-react";

/* ---------- Practice question bank ----------
   Each question: topic, level, prompt (scenario), answer (number), tolerance,
   unit, and an explanation (formula + walkthrough) shown after answering. */

const TOPICS = [
  "All Topics",
  "Rectangle Area",
  "L-Shape",
  "Path Area",
  "Curved Path Length",
  "Trapezoid",
  "Angled Corners",
  "Obstacles",
  "Square Check",
];

const QUESTIONS = [
  // Rectangle Area
  { topic: "Rectangle Area", level: "easy", prompt: "A patio is 10 ft long and 5 ft wide. What's the area in sq ft?", answer: 50, tol: 0.5, unit: "sq ft", explain: "Area = length × width = 10 × 5 = 50 sq ft.", viz: { kind: "rect", l: 10, w: 5 } },
  { topic: "Rectangle Area", level: "easy", prompt: "A walk mat is 8 ft × 3 ft. Area?", answer: 24, tol: 0.5, unit: "sq ft", explain: "8 × 3 = 24 sq ft.", viz: { kind: "rect", l: 8, w: 3 } },
  { topic: "Rectangle Area", level: "easy", prompt: "A landing is 6 ft × 4 ft. Area?", answer: 24, tol: 0.5, unit: "sq ft", explain: "6 × 4 = 24 sq ft.", viz: { kind: "rect", l: 6, w: 4 } },
  { topic: "Rectangle Area", level: "medium", prompt: "A slab is 12 ft long and 7.5 ft wide. Area in sq ft?", answer: 90, tol: 0.5, unit: "sq ft", explain: "12 × 7.5 = 90 sq ft.", viz: { kind: "rect", l: 12, w: 7.5 } },
  { topic: "Rectangle Area", level: "medium", prompt: "A deck section is 15 ft × 9.5 ft. Area?", answer: 142.5, tol: 0.5, unit: "sq ft", explain: "15 × 9.5 = 142.5 sq ft.", viz: { kind: "rect", l: 15, w: 9.5 } },
  { topic: "Rectangle Area", level: "medium", prompt: "A court is 22 ft × 11 ft. Area?", answer: 242, tol: 0.5, unit: "sq ft", explain: "22 × 11 = 242 sq ft.", viz: { kind: "rect", l: 22, w: 11 } },
  { topic: "Rectangle Area", level: "hard", prompt: "A pad is 14.5 ft × 8.25 ft. Area in sq ft (round to 1 decimal)?", answer: 119.6, tol: 0.3, unit: "sq ft", explain: "14.5 × 8.25 = 119.625 → 119.6 sq ft.", viz: { kind: "rect", l: 14.5, w: 8.25 } },
  { topic: "Rectangle Area", level: "hard", prompt: "A slab is 18.75 ft × 6.4 ft. Area (round to 1 decimal)?", answer: 120, tol: 0.3, unit: "sq ft", explain: "18.75 × 6.4 = 120.0 sq ft.", viz: { kind: "rect", l: 18.75, w: 6.4 } },
  { topic: "Rectangle Area", level: "hard", prompt: "A pad is 16.2 ft × 7.85 ft. Area (round to 1 decimal)?", answer: 127.2, tol: 0.3, unit: "sq ft", explain: "16.2 × 7.85 = 127.17 → 127.2 sq ft.", viz: { kind: "rect", l: 16.2, w: 7.85 } },

  // L-Shape
  { topic: "L-Shape", level: "easy", prompt: "Section A = 10×6, Section B = 8×5. Total area?", answer: 100, tol: 0.5, unit: "sq ft", explain: "A=60, B=40, total = 60+40 = 100 sq ft.", viz: { kind: "lshape", aL: 10, aW: 6, bL: 8, bW: 5 } },
  { topic: "L-Shape", level: "easy", prompt: "A = 9×4, B = 5×3. Total area?", answer: 51, tol: 0.5, unit: "sq ft", explain: "A=36, B=15, total = 51 sq ft.", viz: { kind: "lshape", aL: 9, aW: 4, bL: 5, bW: 3 } },
  { topic: "L-Shape", level: "medium", prompt: "A = 12×8, B = 6×7. Total area?", answer: 138, tol: 0.5, unit: "sq ft", explain: "A=96, B=42, total = 138 sq ft.", viz: { kind: "lshape", aL: 12, aW: 8, bL: 6, bW: 7 } },
  { topic: "L-Shape", level: "medium", prompt: "A = 15×10, B = 8×6. Total area?", answer: 198, tol: 0.5, unit: "sq ft", explain: "A=150, B=48, total = 198 sq ft.", viz: { kind: "lshape", aL: 15, aW: 10, bL: 8, bW: 6 } },
  { topic: "L-Shape", level: "hard", prompt: "A = 14×9, B = 10×5.5. Total area?", answer: 181, tol: 0.5, unit: "sq ft", explain: "A=126, B=55, total = 181 sq ft.", viz: { kind: "lshape", aL: 14, aW: 9, bL: 10, bW: 5.5 } },
  { topic: "L-Shape", level: "hard", prompt: "A = 16.5×8.25, B = 9×6.5. Total area (round to 1 decimal)?", answer: 194.6, tol: 0.4, unit: "sq ft", explain: "16.5×8.25=136.125, 9×6.5=58.5 → 194.625 → 194.6 sq ft.", viz: { kind: "lshape", aL: 16.5, aW: 8.25, bL: 9, bW: 6.5 } },

  // Path Area
  { topic: "Path Area", level: "easy", prompt: "Path is 20 ft long, average width 4 ft. Area?", answer: 80, tol: 0.5, unit: "sq ft", explain: "Area = length × avg width = 20 × 4 = 80 sq ft.", viz: { kind: "path", len: 20, ws: [4, 4, 4] } },
  { topic: "Path Area", level: "easy", prompt: "Path 15 ft long, width 3 ft. Area?", answer: 45, tol: 0.5, unit: "sq ft", explain: "15 × 3 = 45 sq ft.", viz: { kind: "path", len: 15, ws: [3, 3, 3] } },
  { topic: "Path Area", level: "medium", prompt: "Path 36 ft long. Widths: 3, 4, 5 ft. Area?", answer: 144, tol: 0.5, unit: "sq ft", explain: "Avg width = (3+4+5)÷3 = 4. Area = 36 × 4 = 144 sq ft.", viz: { kind: "path", len: 36, ws: [3, 4, 5] } },
  { topic: "Path Area", level: "medium", prompt: "Path 50 ft long. Widths: 4, 5, 4, 3 ft. Area?", answer: 200, tol: 0.5, unit: "sq ft", explain: "Avg = (4+5+4+3)÷4 = 4. Area = 50 × 4 = 200 sq ft.", viz: { kind: "path", len: 50, ws: [4, 5, 4, 3] } },
  { topic: "Path Area", level: "hard", prompt: "Path 42.5 ft long. Widths: 3.5, 4, 4.5 ft. Area?", answer: 170, tol: 0.5, unit: "sq ft", explain: "Avg = 4. Area = 42.5 × 4 = 170 sq ft.", viz: { kind: "path", len: 42.5, ws: [3.5, 4, 4.5] } },
  { topic: "Path Area", level: "hard", prompt: "Path 33.75 ft long. Widths: 2.5, 3.5, 4.5, 3.5 ft. Area (round to 1 decimal)?", answer: 118.1, tol: 0.4, unit: "sq ft", explain: "Avg = (2.5+3.5+4.5+3.5)÷4 = 3.5. Area = 33.75 × 3.5 = 118.125 → 118.1 sq ft.", viz: { kind: "path", len: 33.75, ws: [2.5, 3.5, 4.5, 3.5] } },

  // Curved Path Length
  { topic: "Curved Path Length", level: "easy", prompt: "Your measuring wheel reads 25 ft after rolling a curve. Length?", answer: 25, tol: 0.5, unit: "ft", explain: "The wheel gives the true center-line length: 25 ft.", viz: { kind: "curve", wheel: 25 } },
  { topic: "Curved Path Length", level: "easy", prompt: "Wheel reads 12 ft on a garden edge curve. Length?", answer: 12, tol: 0.5, unit: "ft", explain: "Wheel reads true length: 12 ft.", viz: { kind: "curve", wheel: 12 } },
  { topic: "Curved Path Length", level: "medium", prompt: "Segment method: pieces measure 3, 4, 3, 2, 4 ft. Total length?", answer: 16, tol: 0.5, unit: "ft", explain: "3+4+3+2+4 = 16 ft.", viz: { kind: "curve", segs: [3, 4, 3, 2, 4] } },
  { topic: "Curved Path Length", level: "medium", prompt: "Segments: 5, 3, 4, 2, 2, 4 ft. Total length?", answer: 20, tol: 0.5, unit: "ft", explain: "5+3+4+2+2+4 = 20 ft.", viz: { kind: "curve", segs: [5, 3, 4, 2, 2, 4] } },
  { topic: "Curved Path Length", level: "hard", prompt: "Curve longer than your 25 ft tape: first pull 25 ft, mark it, then 18 ft more. Total length?", answer: 43, tol: 0.5, unit: "ft", explain: "25 + 18 = 43 ft.", viz: { kind: "curve", segs: [25, 18] } },
  { topic: "Curved Path Length", level: "hard", prompt: "Tape runs: 25, 25, 9.5 ft on a long curve. Total length?", answer: 59.5, tol: 0.5, unit: "ft", explain: "25 + 25 + 9.5 = 59.5 ft.", viz: { kind: "curve", segs: [25, 25, 9.5] } },

  // Trapezoid
  { topic: "Trapezoid", level: "easy", prompt: "Top 10 ft, bottom 14 ft, height 6 ft. Area?", answer: 72, tol: 0.5, unit: "sq ft", explain: "(10+14)÷2 × 6 = 12 × 6 = 72 sq ft.", viz: { kind: "trap", top: 10, bottom: 14, h: 6 } },
  { topic: "Trapezoid", level: "easy", prompt: "Top 8 ft, bottom 12 ft, height 5 ft. Area?", answer: 50, tol: 0.5, unit: "sq ft", explain: "(8+12)÷2 × 5 = 10 × 5 = 50 sq ft.", viz: { kind: "trap", top: 8, bottom: 12, h: 5 } },
  { topic: "Trapezoid", level: "medium", prompt: "Top 12 ft, bottom 18 ft, height 8 ft. Area?", answer: 120, tol: 0.5, unit: "sq ft", explain: "(12+18)÷2 × 8 = 15 × 8 = 120 sq ft.", viz: { kind: "trap", top: 12, bottom: 18, h: 8 } },
  { topic: "Trapezoid", level: "medium", prompt: "Top 6 ft, bottom 14 ft, height 9 ft. Area?", answer: 90, tol: 0.5, unit: "sq ft", explain: "(6+14)÷2 × 9 = 10 × 9 = 90 sq ft.", viz: { kind: "trap", top: 6, bottom: 14, h: 9 } },
  { topic: "Trapezoid", level: "hard", prompt: "Top 9.5 ft, bottom 15.5 ft, height 7 ft. Area?", answer: 87.5, tol: 0.5, unit: "sq ft", explain: "(9.5+15.5)÷2 × 7 = 12.5 × 7 = 87.5 sq ft.", viz: { kind: "trap", top: 9.5, bottom: 15.5, h: 7 } },
  { topic: "Trapezoid", level: "hard", prompt: "Top 11.25 ft, bottom 18.75 ft, height 6.5 ft. Area (round to 1 decimal)?", answer: 97.5, tol: 0.4, unit: "sq ft", explain: "(11.25+18.75)÷2 × 6.5 = 15 × 6.5 = 97.5 sq ft.", viz: { kind: "trap", top: 11.25, bottom: 18.75, h: 6.5 } },

  // Angled Corners
  { topic: "Angled Corners", level: "easy", prompt: "Rect 10×8, one 2×2 clip. Net area?", answer: 78, tol: 0.5, unit: "sq ft", explain: "Full=80, clip=½×2×2=2, net = 78 sq ft.", viz: { kind: "angled", l: 10, w: 8, clips: [{ a: 2, b: 2 }] } },
  { topic: "Angled Corners", level: "easy", prompt: "Rect 8×6, clip 1×1. Net area?", answer: 47.5, tol: 0.5, unit: "sq ft", explain: "Full=48, clip=½×1×1=0.5, net = 47.5 sq ft.", viz: { kind: "angled", l: 8, w: 6, clips: [{ a: 1, b: 1 }] } },
  { topic: "Angled Corners", level: "medium", prompt: "Rect 12×10, clip 3×2. Net area?", answer: 117, tol: 0.5, unit: "sq ft", explain: "Full=120, clip=½×3×2=3, net = 117 sq ft.", viz: { kind: "angled", l: 12, w: 10, clips: [{ a: 3, b: 2 }] } },
  { topic: "Angled Corners", level: "medium", prompt: "Rect 15×12, clip 4×3. Net area?", answer: 174, tol: 0.5, unit: "sq ft", explain: "Full=180, clip=½×4×3=6, net = 174 sq ft.", viz: { kind: "angled", l: 15, w: 12, clips: [{ a: 4, b: 3 }] } },
  { topic: "Angled Corners", level: "hard", prompt: "Rect 14×9, two clips: 2×2 and 3×1.5. Net area (round to 1 decimal)?", answer: 121.8, tol: 0.3, unit: "sq ft", explain: "Full=126, clips=2 + 2.25 = 4.25, net = 121.75 → 121.8 sq ft.", viz: { kind: "angled", l: 14, w: 9, clips: [{ a: 2, b: 2 }, { a: 3, b: 1.5 }] } },
  { topic: "Angled Corners", level: "hard", prompt: "Rect 20×11, clips 3×2 and 2×3. Net area?", answer: 214, tol: 0.5, unit: "sq ft", explain: "Full=220, clips=½×3×2 + ½×2×3 = 3 + 3 = 6, net = 214 sq ft.", viz: { kind: "angled", l: 20, w: 11, clips: [{ a: 3, b: 2 }, { a: 2, b: 3 }] } },

  // Obstacles
  { topic: "Obstacles", level: "easy", prompt: "Gross 100 sq ft, tree well diameter 4 ft (use 3.14). Net area?", answer: 87.4, tol: 0.5, unit: "sq ft", explain: "Tree = ¼×3.14×4² = 12.56. Net = 100 − 12.56 = 87.4 sq ft.", viz: { kind: "obstacle", gross: 100, circle: 4 } },
  { topic: "Obstacles", level: "easy", prompt: "Gross 64 sq ft, tree dia 3 ft (3.14). Net area?", answer: 56.9, tol: 0.5, unit: "sq ft", explain: "Tree=¼×3.14×9=7.07. Net=64−7.07=56.9 sq ft.", viz: { kind: "obstacle", gross: 64, circle: 3 } },
  { topic: "Obstacles", level: "medium", prompt: "Gross 200, tree dia 6 ft (3.14) + planter 3×2. Net area?", answer: 165.7, tol: 0.5, unit: "sq ft", explain: "Tree=¼×3.14×36=28.3, planter=6, total deduct=34.3. Net=200−34.3=165.7 sq ft.", viz: { kind: "obstacle", gross: 200, circle: 6, rects: [{ l: 3, w: 2 }] } },
  { topic: "Obstacles", level: "medium", prompt: "Gross 150, tree dia 4 ft + pad 2×2. Net area (3.14)?", answer: 133.4, tol: 0.5, unit: "sq ft", explain: "Tree=¼×3.14×16=12.56, pad=4. Net=150−12.56−4=133.4 sq ft.", viz: { kind: "obstacle", gross: 150, circle: 4, rects: [{ l: 2, w: 2 }] } },
  { topic: "Obstacles", level: "hard", prompt: "Gross 300, tree dia 5 ft (3.14), post pad 1×1, planter 4×3. Net area?", answer: 267.4, tol: 0.6, unit: "sq ft", explain: "Tree=¼×3.14×25=19.6, pad=1, planter=12, deduct=32.6. Net=300−32.6=267.4 sq ft.", viz: { kind: "obstacle", gross: 300, circle: 5, rects: [{ l: 1, w: 1 }, { l: 4, w: 3 }] } },
  { topic: "Obstacles", level: "hard", prompt: "Gross 425, two trees dia 4 ft (3.14), planter 5×2, pad 2×1. Net area (round to 1 decimal)?", answer: 387.9, tol: 0.8, unit: "sq ft", explain: "Trees=2×¼×3.14×16=25.1, planter=10, pad=2, deduct=37.1. Net=425−37.1=387.9 sq ft.", viz: { kind: "obstacle", gross: 425, circle: 4, rects: [{ l: 5, w: 2 }, { l: 2, w: 1 }] } },

  // Square Check
  { topic: "Square Check", level: "easy", prompt: "Both diagonals of a rectangle read 10 ft. Is it square? (1 = yes, 0 = no)", answer: 1, tol: 0, unit: "", explain: "Equal diagonals → corners are square (90°).", viz: { kind: "square", diag: 10 } },
  { topic: "Square Check", level: "easy", prompt: "Diagonals read 12.1 ft and 12.0 ft. Is it square? (1 = yes, 0 = no)", answer: 0, tol: 0, unit: "", explain: "Diagonals differ → corners are not square (within ¼ ft is close, but here they differ).", viz: { kind: "square", diag: 12.05 } },
  { topic: "Square Check", level: "medium", prompt: "3-4-5 check: 3 ft on one side, 4 ft on the other. What should the diagonal read in ft?", answer: 5, tol: 0.2, unit: "ft", explain: "3²+4² = 25, √25 = 5 ft for a true right angle.", viz: { kind: "square", legs: [3, 4] } },
  { topic: "Square Check", level: "medium", prompt: "5-12 check on a corner: legs 5 and 12 ft. Diagonal in ft?", answer: 13, tol: 0.2, unit: "ft", explain: "5²+12² = 169, √169 = 13 ft.", viz: { kind: "square", legs: [5, 12] } },
  { topic: "Square Check", level: "hard", prompt: "Scaled 3-4-5: 6 ft and 8 ft legs. What's the diagonal in ft?", answer: 10, tol: 0.2, unit: "ft", explain: "6²+8² = 100, √100 = 10 ft.", viz: { kind: "square", legs: [6, 8] } },
  { topic: "Square Check", level: "hard", prompt: "Scaled 6-8-10: legs 9 ft and 12 ft. Diagonal in ft?", answer: 15, tol: 0.2, unit: "ft", explain: "9²+12² = 225, √225 = 15 ft.", viz: { kind: "square", legs: [9, 12] } },
];

/* ---------- Mini visual for each question ---------- */
function MiniDiagram({ viz }) {
  if (!viz) return null;
  const F = "#0f766e", A = "#dc2626", M = "#475569", fill = "#10b98118";

  if (viz.kind === "rect") {
    const W = 240, H = 150, pad = 26;
    const rw = W - pad * 2, rh = H - pad * 2;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xs mx-auto">
        <rect x={pad} y={pad} width={rw} height={rh} fill={fill} stroke={F} strokeWidth="2" />
        <line x1={pad} y1={pad - 8} x2={pad + rw} y2={pad - 8} stroke={M} strokeWidth="1" />
        <text x={pad + rw / 2} y={pad - 11} textAnchor="middle" fontSize="11" fill="#334155">{viz.l}'</text>
        <line x1={pad - 8} y1={pad} x2={pad - 8} y2={pad + rh} stroke={M} strokeWidth="1" />
        <text x={pad - 11} y={pad + rh / 2} textAnchor="middle" fontSize="11" fill="#334155" transform={`rotate(-90 ${pad - 11} ${pad + rh / 2})`}>{viz.w}'</text>
      </svg>
    );
  }
  if (viz.kind === "lshape") {
    return (
      <svg viewBox="0 0 240 170" className="w-full max-w-xs mx-auto">
        <polygon points="20,20 150,20 150,100 220,100 220,150 20,150" fill={fill} stroke={F} strokeWidth="2" />
        <line x1="150" y1="20" x2="150" y2="150" stroke={A} strokeWidth="1.5" strokeDasharray="5 4" />
        <text x="85" y="90" textAnchor="middle" fontSize="16" fontWeight="700" fill={F}>A</text>
        <text x="185" y="128" textAnchor="middle" fontSize="16" fontWeight="700" fill="#b45309">B</text>
        <text x="85" y="14" textAnchor="middle" fontSize="10" fill="#334155">A: {viz.aL}×{viz.aW}</text>
        <text x="185" y="94" textAnchor="middle" fontSize="10" fill="#334155">B: {viz.bL}×{viz.bW}</text>
      </svg>
    );
  }
  if (viz.kind === "path") {
    const xs = viz.ws.map((_, i) => 50 + i * 70);
    return (
      <svg viewBox="0 0 240 150" className="w-full max-w-xs mx-auto">
        <rect x="20" y="55" width="200" height="45" fill="#6366f115" stroke="#4338ca" strokeWidth="2" rx="4" />
        <line x1="20" y1="120" x2="220" y2="120" stroke={M} strokeWidth="1" />
        <text x="120" y="116" textAnchor="middle" fontSize="10" fill="#334155">Length {viz.len}'</text>
        {viz.ws.map((w, i) => (
          <g key={i}>
            <line x1={xs[i]} y1="55" x2={xs[i]} y2="100" stroke={A} strokeWidth="1.5" strokeDasharray="3 2" />
            <text x={xs[i]} y="49" textAnchor="middle" fontSize="10" fill={A} fontWeight="600">{w}'</text>
          </g>
        ))}
      </svg>
    );
  }
  if (viz.kind === "curve") {
    return (
      <svg viewBox="0 0 240 160" className="w-full max-w-xs mx-auto">
        <path d="M 20 130 Q 90 10 150 80 T 220 30" fill="none" stroke="#4338ca" strokeWidth="18" strokeLinecap="round" opacity="0.3" />
        <path d="M 20 130 Q 90 10 150 80 T 220 30" fill="none" stroke="#4338ca" strokeWidth="2" />
        {viz.segs ? (
          <>
            <line x1="20" y1="150" x2="220" y2="150" stroke="#b45309" strokeWidth="2" />
            <text x="120" y="148" textAnchor="middle" fontSize="10" fill="#b45309" fontWeight="600">segs: {viz.segs.join(" + ")} = {viz.segs.reduce((a, b) => a + b, 0)}</text>
          </>
        ) : (
          <text x="120" y="150" textAnchor="middle" fontSize="10" fill="#b45309" fontWeight="600">wheel = {viz.wheel}'</text>
        )}
      </svg>
    );
  }
  if (viz.kind === "trap") {
    return (
      <svg viewBox="0 0 240 170" className="w-full max-w-xs mx-auto">
        <polygon points="40,140 200,140 175,40 65,40" fill="#6366f115" stroke="#4338ca" strokeWidth="2" />
        <line x1="40" y1="150" x2="200" y2="150" stroke={M} strokeWidth="1" />
        <text x="120" y="162" textAnchor="middle" fontSize="10" fill="#334155">bottom {viz.bottom}'</text>
        <line x1="65" y1="30" x2="175" y2="30" stroke={M} strokeWidth="1" />
        <text x="120" y="24" textAnchor="middle" fontSize="10" fill="#334155">top {viz.top}'</text>
        <line x1="28" y1="40" x2="28" y2="140" stroke={A} strokeWidth="1.5" />
        <text x="22" y="94" textAnchor="end" fontSize="10" fill={A}>h {viz.h}'</text>
      </svg>
    );
  }
  if (viz.kind === "angled") {
    return (
      <svg viewBox="0 0 240 170" className="w-full max-w-xs mx-auto">
        <rect x="20" y="20" width="200" height="120" fill={fill} stroke={F} strokeWidth="2" />
        <polygon points="140,20 140,60 100,60" fill="#dc262630" stroke={A} strokeWidth="1.5" strokeDasharray="4 3" />
        <text x="118" y="46" textAnchor="middle" fontSize="9" fill={A}>{viz.clips[0].a}×{viz.clips[0].b}</text>
        <text x="120" y="155" textAnchor="middle" fontSize="10" fill="#334155">{viz.l}×{viz.w} minus clip(s)</text>
      </svg>
    );
  }
  if (viz.kind === "obstacle") {
    return (
      <svg viewBox="0 0 240 160" className="w-full max-w-xs mx-auto">
        <rect x="20" y="20" width="200" height="110" fill={fill} stroke={F} strokeWidth="2" rx="4" />
        <circle cx="110" cy="70" r="22" fill="#f59e0b40" stroke="#b45309" strokeWidth="2" />
        <text x="110" y="74" textAnchor="middle" fontSize="9" fill="#7c2d12" fontWeight="700">⌀{viz.circle}'</text>
        {viz.rects && viz.rects.map((r, i) => (
          <g key={i}>
            <rect x={160 + i * 18} y={90 - i * 10} width={Math.min(r.l * 6, 24)} height={Math.min(r.w * 6, 24)} fill="#dc262630" stroke={A} strokeWidth="2" />
            <text x={160 + i * 18 + 12} y={106 - i * 10} textAnchor="middle" fontSize="8" fill="#7f1d1d">{r.l}×{r.w}</text>
          </g>
        ))}
        <text x="120" y="148" textAnchor="middle" fontSize="10" fill="#334155">gross {viz.gross} − obstacles</text>
      </svg>
    );
  }
  if (viz.kind === "square") {
    return (
      <svg viewBox="0 0 240 170" className="w-full max-w-xs mx-auto">
        <rect x="40" y="30" width="160" height="110" fill={fill} stroke={F} strokeWidth="2" />
        <line x1="40" y1="30" x2="200" y2="140" stroke={A} strokeWidth="1.5" strokeDasharray="4 3" />
        <line x1="200" y1="30" x2="40" y2="140" stroke={A} strokeWidth="1.5" strokeDasharray="4 3" />
        {viz.legs ? (
          <text x="120" y="160" textAnchor="middle" fontSize="10" fill="#334155">legs {viz.legs[0]}' & {viz.legs[1]}' → diagonal?</text>
        ) : (
          <text x="120" y="160" textAnchor="middle" fontSize="10" fill="#334155">both diagonals = {viz.diag}' → square?</text>
        )}
      </svg>
    );
  }
  return null;
}

const LEVELS = ["easy", "medium", "hard"];

const levelColor = {
  easy: "bg-emerald-100 text-emerald-700 border-emerald-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  hard: "bg-rose-100 text-rose-700 border-rose-200",
};

export default function MeasurePractice() {
  const [topic, setTopic] = useState("All Topics");
  const [level, setLevel] = useState("All");
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState({ right: 0, total: 0 });

  const pool = useMemo(() => {
    let p = QUESTIONS;
    if (topic !== "All Topics") p = p.filter((q) => q.topic === topic);
    if (level !== "All") p = p.filter((q) => q.level === level);
    if (!p.length) p = QUESTIONS;
    // Shuffle so each set arrives in a fresh order
    p = [...p].sort(() => Math.random() - 0.5);
    return p;
  }, [topic, level]);

  const q = pool[idx % pool.length];

  const reset = (newTopic, newLevel) => {
    setTopic(newTopic);
    setLevel(newLevel);
    setIdx(0);
    setAnswer("");
    setSubmitted(false);
    setCorrect(false);
    setScore({ right: 0, total: 0 });
  };

  const check = () => {
    if (answer === "") return;
    const val = parseFloat(answer);
    const ok = !isNaN(val) && Math.abs(val - q.answer) <= q.tol;
    setCorrect(ok);
    setSubmitted(true);
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), total: s.total + 1 }));
  };

  const next = () => {
    setIdx((i) => i + 1);
    setAnswer("");
    setSubmitted(false);
    setCorrect(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
          <Dumbbell size={20} className="text-white" />
        </div>
        <div>
          <h2 className="font-bold text-slate-800 text-base">Practice It</h2>
          <p className="text-xs text-slate-500">Work through real examples — easy, medium & hard.</p>
        </div>
      </div>

      {/* Topic picker */}
      <div className="flex flex-wrap gap-2">
        {TOPICS.map((t) => (
          <button
            key={t}
            onClick={() => reset(t, level)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              topic === t
                ? "bg-emerald-700 text-white border-emerald-700"
                : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Difficulty picker */}
      <div className="flex gap-2">
        {["All", ...LEVELS].map((l) => (
          <button
            key={l}
            onClick={() => reset(topic, l)}
            className={`text-xs px-3 py-1.5 rounded-full border transition capitalize ${
              level === l
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Score */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">
          Score: <strong className="text-slate-800">{score.right}</strong> / {score.total}
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${levelColor[q.level]}`}>
          {q.level}
        </span>
      </div>

      {/* Question card */}
      <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 space-y-3">
        <MiniDiagram viz={q.viz} />
        <p className="text-sm text-slate-800 font-medium">{q.prompt}</p>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={submitted}
            onKeyDown={(e) => e.key === "Enter" && !submitted && check()}
            placeholder="Your answer"
            className="flex-1 rounded-md border border-input bg-white px-3 py-2 text-base shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
          {q.unit && <span className="self-center text-sm text-slate-500">{q.unit}</span>}
        </div>

        {!submitted ? (
          <button
            onClick={check}
            disabled={answer === ""}
            className="w-full bg-emerald-700 text-white font-semibold rounded-lg py-2.5 disabled:opacity-40 active:scale-95 transition"
          >
            Check Answer
          </button>
        ) : (
          <div className="space-y-3">
            <div
              className={`flex items-center gap-2 text-sm font-semibold rounded-lg p-2.5 ${
                correct ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}
            >
              {correct ? <Check size={18} /> : <X size={18} />}
              {correct ? "Correct!" : `Not quite — answer is ${q.answer}${q.unit ? " " + q.unit : ""}`}
            </div>
            <div className="text-sm text-slate-600 bg-white rounded-lg border border-slate-200 p-2.5">
              <span className="font-semibold text-slate-700">How: </span>
              {q.explain}
            </div>
            <button
              onClick={next}
              className="w-full bg-slate-800 text-white font-semibold rounded-lg py-2.5 flex items-center justify-center gap-2 active:scale-95 transition"
            >
              Next Question <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Reset */}
      <button
        onClick={() => reset(topic, level)}
        className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700"
      >
        <RotateCcw size={14} /> Restart this set
      </button>
    </div>
  );
}
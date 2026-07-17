import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, GraduationCap, Spline, Route, Triangle as TriangleIcon, CheckSquare } from "lucide-react";

/* ---------- Visual diagrams (inline SVG, drawn to concept, not hard scale) ---------- */

function LShapeDiagram() {
  return (
    <svg viewBox="0 0 260 210" className="w-full max-w-sm mx-auto">
      {/* L-shape outline */}
      <polygon
        points="20,20 160,20 160,110 240,110 240,190 20,190"
        fill="#10b98115"
        stroke="#0f766e"
        strokeWidth="2"
      />
      {/* divider into A and B */}
      <line x1="160" y1="20" x2="160" y2="110" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 4" />
      <line x1="160" y1="110" x2="160" y2="190" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 4" />
      {/* section labels */}
      <text x="90" y="105" textAnchor="middle" fontSize="18" fontWeight="700" fill="#0f766e">A</text>
      <text x="200" y="155" textAnchor="middle" fontSize="18" fontWeight="700" fill="#b45309">B</text>
      {/* dimension lines */}
      {/* top length */}
      <line x1="20" y1="10" x2="160" y2="10" stroke="#475569" strokeWidth="1" />
      <text x="90" y="8" textAnchor="middle" fontSize="10" fill="#334155">L1 = 14'</text>
      {/* right length */}
      <line x1="250" y1="110" x2="250" y2="190" stroke="#475569" strokeWidth="1" />
      <text x="250" y="154" textAnchor="start" fontSize="10" fill="#334155">L2 = 8'</text>
      {/* top width */}
      <line x1="10" y1="20" x2="10" y2="110" stroke="#475569" strokeWidth="1" />
      <text x="6" y="70" textAnchor="end" fontSize="10" fill="#334155">W1 = 9'</text>
      {/* bottom width */}
      <line x1="10" y1="190" x2="10" y2="110" stroke="#475569" strokeWidth="1" />
    </svg>
  );
}

function PathWidthDiagram() {
  return (
    <svg viewBox="0 0 280 150" className="w-full max-w-sm mx-auto">
      {/* path body */}
      <rect x="30" y="50" width="220" height="50" fill="#6366f115" stroke="#4338ca" strokeWidth="2" rx="4" />
      {/* length line */}
      <line x1="30" y1="120" x2="250" y2="120" stroke="#475569" strokeWidth="1" />
      <text x="140" y="118" textAnchor="middle" fontSize="10" fill="#334155">Length = 36'</text>
      {/* width measurements at 3 points */}
      {[60, 140, 220].map((x, i) => (
        <g key={i}>
          <line x1={x} y1="50" x2={x} y2="100" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="3 2" />
          <text x={x} y="44" textAnchor="middle" fontSize="10" fill="#dc2626" fontWeight="600">
            W{i + 1}
          </text>
        </g>
      ))}
      <text x="140" y="138" textAnchor="middle" fontSize="9" fill="#475569">Average width = (W1+W2+W3) ÷ 3</text>
    </svg>
  );
}

function CurvedPathDiagram() {
  return (
    <svg viewBox="0 0 280 160" className="w-full max-w-sm mx-auto">
      {/* curved path as two arcs */}
      <path d="M 20 130 Q 80 20 140 80 T 260 30" fill="none" stroke="#4338ca" strokeWidth="22" strokeLinecap="round" opacity="0.35" />
      <path d="M 20 130 Q 80 20 140 80 T 260 30" fill="none" stroke="#4338ca" strokeWidth="2" />
      {/* segment marks */}
      {[60, 110, 160, 210].map((x, i) => (
        <g key={i}>
          <line x1={x} y1="0" x2={x} y2="160" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
          <text x={x} y="155" textAnchor="middle" fontSize="9" fill="#475569">S{i + 1}</text>
        </g>
      ))}
      <text x="140" y="14" textAnchor="middle" fontSize="9" fill="#334155">Measure in straight segments, then add lengths</text>
    </svg>
  );
}

function TrapezoidDiagram() {
  return (
    <svg viewBox="0 0 260 170" className="w-full max-w-sm mx-auto">
      <polygon points="40,140 220,140 190,40 70,40" fill="#6366f115" stroke="#4338ca" strokeWidth="2" />
      <line x1="40" y1="150" x2="220" y2="150" stroke="#475569" strokeWidth="1" />
      <text x="130" y="162" textAnchor="middle" fontSize="10" fill="#334155">B = 18' (bottom)</text>
      <line x1="70" y1="30" x2="190" y2="30" stroke="#475569" strokeWidth="1" />
      <text x="130" y="24" textAnchor="middle" fontSize="10" fill="#334155">b = 12' (top)</text>
      <line x1="30" y1="40" x2="30" y2="140" stroke="#dc2626" strokeWidth="1.5" />
      <text x="24" y="94" textAnchor="end" fontSize="10" fill="#dc2626">h = 8' (height)</text>
      <text x="130" y="95" textAnchor="middle" fontSize="9" fill="#475569">Area = ½ × (B + b) × h</text>
    </svg>
  );
}

function AngledCornerDiagram() {
  return (
    <svg viewBox="0 0 240 180" className="w-full max-w-sm mx-auto">
      <polygon points="30,150 210,150 210,40 140,40 90,80 30,80" fill="#10b98115" stroke="#0f766e" strokeWidth="2" />
      {/* angled cut triangle */}
      <polygon points="140,40 90,80 140,80" fill="#dc262630" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="112" y="62" textAnchor="middle" fontSize="9" fill="#dc2626">T</text>
      <line x1="140" y1="40" x2="140" y2="80" stroke="#475569" strokeWidth="1" />
      <text x="150" y="64" fontSize="9" fill="#334155">a = 4'</text>
      <line x1="90" y1="80" x2="90" y2="40" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
      <text x="80" y="62" textAnchor="end" fontSize="9" fill="#334155">b = 6'</text>
      <text x="120" y="115" textAnchor="middle" fontSize="9" fill="#475569">Cut triangle T = ½ × a × b, subtract it</text>
    </svg>
  );
}

function ObstacleDiagram() {
  return (
    <svg viewBox="0 0 260 180" className="w-full max-w-sm mx-auto">
      <rect x="20" y="20" width="220" height="140" fill="#10b98115" stroke="#0f766e" strokeWidth="2" rx="4" />
      <circle cx="140" cy="90" r="28" fill="#f59e0b40" stroke="#b45309" strokeWidth="2" />
      <text x="140" y="94" textAnchor="middle" fontSize="9" fill="#7c2d12" fontWeight="700">Tree</text>
      <rect x="200" y="120" width="30" height="30" fill="#dc262630" stroke="#dc2626" strokeWidth="2" />
      <text x="215" y="138" textAnchor="middle" fontSize="8" fill="#7f1d1d">Post</text>
      <line x1="112" y1="90" x2="168" y2="90" stroke="#b45309" strokeWidth="1" />
      <text x="140" y="128" textAnchor="middle" fontSize="8" fill="#b45309">⌀ 4.5'</text>
      <text x="130" y="170" textAnchor="middle" fontSize="9" fill="#475569">Net = Gross − tree − post (and any planter)</text>
    </svg>
  );
}

function CurveOffsetDiagram() {
  return (
    <svg viewBox="0 0 260 160" className="w-full max-w-sm mx-auto">
      <path d="M 20 130 Q 100 10 240 40" fill="none" stroke="#4338ca" strokeWidth="2" />
      <path d="M 40 140 Q 110 30 245 55" fill="none" stroke="#4338ca" strokeWidth="2" />
      {[40, 90, 140, 190].map((x, i) => (
        <line
          key={i}
          x1={x}
          y1={130 - i * 3}
          x2={x + 5}
          y2={140 - i * 3 - 2}
          stroke="#94a3b8"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      ))}
      <text x="130" y="150" textAnchor="middle" fontSize="9" fill="#475569">Offset lines (perpendicular to curve)</text>
    </svg>
  );
}

function SquareCheckDiagram() {
  return (
    <svg viewBox="0 0 220 180" className="w-full max-w-xs mx-auto">
      <rect x="30" y="30" width="160" height="120" fill="#10b98115" stroke="#0f766e" strokeWidth="2" />
      {/* diagonals */}
      <line x1="30" y1="30" x2="190" y2="150" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 3" />
      <line x1="190" y1="30" x2="30" y2="150" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="60" y="100" fontSize="10" fill="#dc2626">D1</text>
      <text x="150" y="100" fontSize="10" fill="#dc2626">D2</text>
      <text x="110" y="170" textAnchor="middle" fontSize="9" fill="#334155">If D1 ≈ D2, corners are square (90°)</text>
    </svg>
  );
}

/* ---------- Guides ---------- */

const HOW_TO = [
  {
    icon: TriangleIcon,
    title: "Irregular / L-Shaped Areas",
    intro: "Break an odd shape into simple rectangles, measure each part, then add them together.",
    diagram: <LShapeDiagram />,
    steps: [
      "Look at the area and mentally split it into rectangles. An L-shape becomes two rectangles labeled A and B.",
      "Draw the split line on the ground with chalk or a string line.",
      "Measure Rectangle A: length (L1) along the top and width (W1) down the side.",
      "Measure Rectangle B: length (L2) along the bottom and width (W2) up the side.",
      "Calculate: Area A = L1 × W1,  Area B = L2 × W2.",
      "Total area = Area A + Area B. Use the Estimate Builder with sections A and B to get this automatically.",
      "Tip: Any notch, bumpout, or angled corner can be split the same way — keep breaking it down until every piece is a rectangle or triangle.",
    ],
  },
  {
    icon: Route,
    title: "Measuring a Path or Walkway",
    intro: "Paths often vary in width. Take several width measurements and average them for an accurate area.",
    diagram: <PathWidthDiagram />,
    steps: [
      "Measure the full length of the path down the center, from start to end.",
      "Measure the width at 3 or more points: near the start, the middle, and near the end.",
      "Label each width W1, W2, W3.",
      "Average width = (W1 + W2 + W3) ÷ 3.",
      "Area = Length × Average width.",
      "If one section is clearly wider (an entrance flare, a landing), treat it as its own rectangle section.",
      "Common mistake: Measuring width only once — paths that taper give you the wrong area.",
    ],
  },
  {
    icon: Spline,
    title: "Curved & Freeform Paths",
    intro: "Curves can't be measured with one tape pull. Use the offset/staking method for an accurate total length, then average the width.",
    diagram: <CurvedPathDiagram />,
    steps: [
      "Lay a baseline (a string line) along the general direction of the curve.",
      "Place stakes or mark points every 2–3 ft along the center of the curve.",
      "At each stake, measure the perpendicular offset from the baseline to the curve — this traces the true shape.",
      "Measure each straight segment between stakes (S1, S2, S3…) and add them for total center-line length.",
      "Measure the width at each stake and average them — curves taper too, so 3+ widths matter.",
      "Area = total length × average width.",
      "For tight curves, add 10–15% extra for cuts and waste (pavers must be scribed to the curve).",
      "Quick method: lay a garden hose or rope along the curve, mark the ends, then measure the rope straight for a fast total length.",
    ],
  },
  {
    icon: Spline,
    title: "Curved Edges & Radius Corners",
    intro: "When a patio or lawn has a rounded edge or radius corner, treat the curve as a partial circle to find its area.",
    diagram: <CurveOffsetDiagram />,
    steps: [
      "Find the center point of the curve — the deepest part of the arc is the radius.",
      "Measure from the start of the curve to the end across the opening (the chord).",
      "Measure how deep the curve bulges at its middle (the sagitta / rise).",
      "Estimate radius: R ≈ (chord² ÷ 8 × rise) + (rise ÷ 2).",
      "Treat the rounded corner as a quarter- or half-circle sector: Area = ½ × π × R² (half) or ¼ × π × R² (quarter).",
      "If the curve is small (under 3 ft), just measure a bounding square and subtract a small triangle — close enough for waste to cover.",
      "When in doubt, over-measure slightly and rely on the waste percentage to absorb cut loss.",
    ],
  },
  {
    icon: CheckSquare,
    title: "Trapezoid / Tapered Areas",
    intro: "Driveways and paths often widen or narrow. When the two long sides aren't equal, it's a trapezoid — not a rectangle.",
    diagram: <TrapezoidDiagram />,
    steps: [
      "Measure the top width (b) and the bottom width (B) — the two parallel sides.",
      "Measure the perpendicular height (h) straight across between them, not along the slanted side.",
      "Formula: Area = ½ × (B + b) × h.",
      "Example: B = 18', b = 12', h = 8' → ½ × 30 × 8 = 120 sq ft.",
      "Common mistake: Using only the average of the two ends as 'width' works — but only if both ends are parallel. If not, split into a trapezoid + triangle.",
      "Double-check: If B and b are equal, the trapezoid formula becomes a plain rectangle.",
    ],
  },
  {
    icon: CheckSquare,
    title: "Angled Corners & 45° Cuts",
    intro: "Patios and decks often have a corner clipped at an angle. Split the cut into a triangle and subtract it.",
    diagram: <AngledCornerDiagram />,
    steps: [
      "Measure the full bounding rectangle around the area first.",
      "Find the clipped corner and measure the two legs of the cut (a and b).",
      "Cut triangle area = ½ × a × b.",
      "Net area = bounding rectangle − cut triangle.",
      "If there are multiple clipped corners, subtract each triangle separately.",
      "Tip: A 45° clip means a = b. A 2' × 2' clip removes exactly 2 sq ft.",
    ],
  },
  {
    icon: CheckSquare,
    title: "Obstacles & Deductions",
    intro: "Tree wells, posts, planters, and existing concrete sit inside your area and must be subtracted.",
    diagram: <ObstacleDiagram />,
    steps: [
      "Measure the full bounding area (Gross) as if nothing were in the way.",
      "For a round obstacle (tree well), measure the diameter and use Area = ¼ × π × diameter².",
      "For a square/rectangular obstacle (planter, post pad), measure length × width.",
      "List every deduction, then: Net = Gross − sum of all deductions.",
      "Common mistake: Forgetting small items — a 1'×1' post pad is still 1 sq ft each.",
      "Double-check: Walk the area and physically point at every obstacle before you finalize the deduction list.",
    ],
  },
  {
    icon: CheckSquare,
    title: "Checking for Square (Right Angles)",
    intro: "Before trusting a rectangle measurement, confirm the corners are actually 90° using diagonals.",
    diagram: <SquareCheckDiagram />,
    steps: [
      "Measure both diagonals of the rectangle (corner to opposite corner).",
      "If the two diagonals are equal (within an inch or two), the corners are square.",
      "If they differ, the shape is a parallelogram — re-measure each side and note which corner is off.",
      "For a 3-4-5 check: mark 3 ft on one side and 4 ft on the other; the diagonal should measure 5 ft for a true right angle.",
      "Use this on patios, driveways, and any area that should be a clean rectangle.",
    ],
  },
];

export default function HowToMeasure() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="sticky top-0 z-20 bg-emerald-800 text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-lg hover:bg-emerald-700">
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <GraduationCap size={22} />
          <h1 className="text-lg font-bold">How To Measure</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
          <strong>Training guide:</strong> Visual, step-by-step methods for getting accurate field measurements — break down odd shapes, measure paths that change width, handle curves, and verify your corners are square.
        </div>

        {HOW_TO.map((g, i) => {
          const Icon = g.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-700 flex items-center justify-center">
                  <Icon size={20} className="text-white" />
                </div>
                <h2 className="font-bold text-slate-800 text-base">{g.title}</h2>
              </div>
              <p className="text-sm text-slate-600">{g.intro}</p>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                {g.diagram}
              </div>
              <ol className="space-y-2">
                {g.steps.map((step, j) => (
                  <li key={j} className="flex gap-2 text-sm text-slate-600">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {j + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}

        <div className="bg-emerald-800 text-white rounded-2xl p-5">
          <h2 className="font-bold text-lg mb-2">Ready to calculate?</h2>
          <p className="text-sm text-emerald-100 mb-3">
            Use the Estimate Builder to turn these measurements into sections A, B, C with automatic area totals.
          </p>
          <button
            onClick={() => navigate("/builder")}
            className="w-full bg-amber-400 text-emerald-900 font-bold rounded-xl py-3 active:scale-95 transition"
          >
            Open Estimate Builder
          </button>
        </div>
      </div>
    </div>
  );
}
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
    title: "L-Shaped & Odd Areas",
    intro: "Split a weird shape into simple rectangles, then add the pieces.",
    diagram: <LShapeDiagram />,
    steps: [
      "Break the shape into two rectangles — call them A and B.",
      "Mark the split line with chalk or a string.",
      "Measure A: length across the top, width down the side.",
      "Measure B: length across the bottom, width up the side.",
      "Area A = length × width. Area B = same.",
      "Total area = Area A + Area B. (The Estimate Builder does this for you with sections.)",
      "Tip: Any notch or bump can be split the same way — keep going until every piece is a rectangle or triangle.",
    ],
  },
  {
    icon: Route,
    title: "Paths & Walkways",
    intro: "Paths change width. Measure the width in a few spots and average it.",
    diagram: <PathWidthDiagram />,
    steps: [
      "Measure the full length down the middle, start to end.",
      "Measure the width in 3 spots: start, middle, end.",
      "Average width = the 3 widths added up, then ÷ 3.",
      "Area = length × average width.",
      "If one part is much wider (an entrance), treat it as its own section.",
      "Mistake to avoid: measuring width only once.",
    ],
  },
  {
    icon: Spline,
    title: "Curved Paths",
    intro: "A curve won't fit one tape. Break it into short straight pieces, add them up, then average the width.",
    diagram: <CurvedPathDiagram />,
    steps: [
      "Put marks every 2–3 ft along the middle of the curve.",
      "Measure each short straight piece between marks and add them all up for total length.",
      "Measure the width at each mark and average them.",
      "Area = total length × average width.",
      "For tight curves, add 10–15% extra for cuts and waste.",
      "Quick way: lay a hose or rope along the curve, then measure the rope straight.",
    ],
  },
  {
    icon: Spline,
    title: "Rounded Edges & Corners",
    intro: "Treat a rounded corner like part of a circle to get its area.",
    diagram: <CurveOffsetDiagram />,
    steps: [
      "Find how deep the curve bows — that's the radius.",
      "Measure straight across the opening of the curve.",
      "A half-circle corner: Area = ½ × 3.14 × radius².",
      "A quarter-circle corner: Area = ¼ × 3.14 × radius².",
      "Small curve (under 3 ft)? Just measure a square and subtract a small triangle — close enough.",
      "When unsure, measure a bit big and let the waste % cover the cuts.",
    ],
  },
  {
    icon: CheckSquare,
    title: "Tapered Areas (Wider on One End)",
    intro: "A driveway that's wider at one end isn't a rectangle — it's a trapezoid.",
    diagram: <TrapezoidDiagram />,
    steps: [
      "Measure the top width and the bottom width (the two parallel sides).",
      "Measure straight across between them for the height.",
      "Area = (top + bottom) ÷ 2 × height.",
      "Example: top 12', bottom 18', height 8' → (30 ÷ 2) × 8 = 120 sq ft.",
      "If both ends are the same, it's just a plain rectangle.",
    ],
  },
  {
    icon: CheckSquare,
    title: "Angled & Clipped Corners",
    intro: "A corner cut at an angle = a triangle you subtract.",
    diagram: <AngledCornerDiagram />,
    steps: [
      "Measure the full rectangle around the area first.",
      "Find the clipped corner and measure its two short sides.",
      "Cut area = ½ × side a × side b.",
      "Net area = full rectangle − cut corner.",
      "More than one clip? Subtract each one.",
      "A 45° cut has equal sides — a 2' × 2' cut removes 2 sq ft.",
    ],
  },
  {
    icon: CheckSquare,
    title: "Things in the Way (Deductions)",
    intro: "Trees, posts, and planters sit in your area — subtract them.",
    diagram: <ObstacleDiagram />,
    steps: [
      "Measure the whole area first, as if nothing were there.",
      "Round thing (tree well): Area = ¼ × 3.14 × diameter².",
      "Square thing (planter, post pad): length × width.",
      "Net area = whole area − all the obstacles added up.",
      "Mistake to avoid: skipping small items — a 1'×1' pad is still 1 sq ft.",
      "Double-check: walk the area and point at each obstacle before you finish.",
    ],
  },
  {
    icon: CheckSquare,
    title: "Check Your Corners Are Square",
    intro: "Before trusting a rectangle, make sure its corners are really 90°.",
    diagram: <SquareCheckDiagram />,
    steps: [
      "Measure both diagonals (corner to opposite corner).",
      "If they're about equal, the corners are square.",
      "If they differ, one corner is off — re-measure the sides.",
      "3-4-5 trick: mark 3' on one side and 4' on the other — the diagonal should be 5'.",
      "Use this on patios, driveways, anywhere that should be a clean rectangle.",
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
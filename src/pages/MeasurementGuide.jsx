import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, BookOpen, Ruler, Square, Circle as CircleIcon, Triangle as TriangleIcon, ArrowUp, ArrowRight, Layers } from "lucide-react";

const GUIDES = [
  {
    icon: Square,
    title: "Rectangle & Square",
    steps: [
      "What to measure: Length and Width of the area.",
      "Place tape along the longest side for Length, then the perpendicular side for Width.",
      "Record both in feet + inches (e.g. 46 ft 3 in × 5 ft).",
      "Formula: Area = Length × Width",
      "Example: 46.25 ft × 5 ft = 231.25 sq ft",
      "Common mistake: Mixing up feet and inches — always convert inches to decimal feet first.",
      "Double-check: Re-measure the diagonal — both diagonals should be roughly equal for a true rectangle.",
    ],
  },
  {
    icon: CircleIcon,
    title: "Circle & Curved Area",
    steps: [
      "What to measure: Diameter (across the widest point, edge to edge through center).",
      "Place tape straight across the center of the circle.",
      "Record the diameter in feet.",
      "Formula: Radius = Diameter ÷ 2; Circumference = Diameter × 3.1416; Area = 3.1416 × Radius²",
      "Example: Diameter 11 ft → Radius 5.5 ft → Circumference ≈ 34.56 lin ft → Area ≈ 95.03 sq ft",
      "Common mistake: Confusing circumference with area — circumference is linear feet (around the edge), area is square feet.",
      "Double-check: Circumference ÷ 3.1416 should equal the diameter you measured.",
    ],
  },
  {
    icon: TriangleIcon,
    title: "Triangle",
    steps: [
      "What to measure: Base and Height (perpendicular to the base).",
      "Place tape along the base, then measure straight up to the highest point.",
      "Record both in feet.",
      "Formula: Area = Base × Height ÷ 2",
      "Example: Base 12 ft × Height 8 ft ÷ 2 = 48 sq ft",
      "Common mistake: Measuring a slanted side instead of the true perpendicular height.",
      "Double-check: If you have all 3 sides, use the three-sides calculator to verify.",
    ],
  },
  {
    icon: Layers,
    title: "Irregular Areas",
    steps: [
      "Divide the irregular space into rectangles, triangles, and circles.",
      "Label each section (A, B, C, D).",
      "Measure and calculate each section separately.",
      "Add all sections together for the Gross Area.",
      "Subtract obstacles (concrete, tree wells, planters, posts).",
      "Net Area = Gross Area − Deductions",
      "Common mistake: Forgetting to subtract non-renovated areas.",
      "Double-check: Walk the perimeter and confirm every section is accounted for.",
    ],
  },
  {
    icon: ArrowUp,
    title: "Rise & Run (Steps)",
    steps: [
      "Rise = vertical height (how tall each step is).",
      "Run = horizontal depth (how deep each step is).",
      "Tread = the surface you step on.",
      "Riser = the vertical face of the step.",
      "Total Rise = full vertical height from bottom to top.",
      "Total Run = full horizontal distance of the stair system.",
      "Formula: Individual Rise = Total Height ÷ Number of Risers",
      "Common mistake: Counting steps instead of risers — a 3-step staircase has 3 risers.",
      "Typical residential riser: 6–8 inches. Check local building codes.",
    ],
  },
  {
    icon: Ruler,
    title: "Borders & Edging",
    steps: [
      "Measure the total perimeter (linear footage around the edge).",
      "Determine border width (4, 6, 8, 9, or 12 inches are common).",
      "Convert border width to feet (6 in = 0.5 ft).",
      "Formula: Border Area = Linear Footage × Border Width (ft)",
      "Example: 203.89 lin ft × 0.5 ft = 101.95 sq ft",
      "Common mistake: Forgetting to convert inches to feet before multiplying.",
      "Double-check: Measure the perimeter twice, walking it in both directions.",
    ],
  },
];

export default function MeasurementGuide() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="sticky top-0 z-20 bg-emerald-800 text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-lg hover:bg-emerald-700"><ChevronLeft size={24} /></button>
        <div className="flex items-center gap-2">
          <BookOpen size={22} />
          <h1 className="text-lg font-bold">Measurement Guide</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <strong>How to use:</strong> Each guide shows what to measure, where to place the tape, which formula is used, a worked example, common mistakes, and how to double-check.
        </div>

        {GUIDES.map((guide, i) => {
          const Icon = guide.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-700 flex items-center justify-center">
                  <Icon size={20} className="text-white" />
                </div>
                <h2 className="font-bold text-slate-800 text-base">{guide.title}</h2>
              </div>
              <ol className="space-y-2">
                {guide.steps.map((step, j) => (
                  <li key={j} className="flex gap-2 text-sm text-slate-600">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 font-semibold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{j + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}

        {/* Diagram legend */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="font-bold text-slate-800 mb-3">Diagram Legend</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2"><ArrowRight size={16} className="text-emerald-700" /> Length / Width</div>
            <div className="flex items-center gap-2"><ArrowUp size={16} className="text-emerald-700" /> Rise / Height</div>
            <div className="flex items-center gap-2"><CircleIcon size={16} className="text-emerald-700" /> Radius / Diameter</div>
            <div className="flex items-center gap-2"><Ruler size={16} className="text-emerald-700" /> Perimeter</div>
          </div>
        </div>
      </div>
    </div>
  );
}
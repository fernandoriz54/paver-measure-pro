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
  { topic: "Rectangle Area", level: "easy", prompt: "A patio is 10 ft long and 5 ft wide. What's the area in sq ft?", answer: 50, tol: 0.5, unit: "sq ft", explain: "Area = length × width = 10 × 5 = 50 sq ft." },
  { topic: "Rectangle Area", level: "medium", prompt: "A slab is 12 ft long and 7.5 ft wide. Area in sq ft?", answer: 90, tol: 0.5, unit: "sq ft", explain: "12 × 7.5 = 90 sq ft." },
  { topic: "Rectangle Area", level: "hard", prompt: "A pad is 14.5 ft × 8.25 ft. Area in sq ft (round to 1 decimal)?", answer: 119.6, tol: 0.3, unit: "sq ft", explain: "14.5 × 8.25 = 119.625 → 119.6 sq ft." },

  // L-Shape
  { topic: "L-Shape", level: "easy", prompt: "Section A = 10×6, Section B = 8×5. Total area?", answer: 100, tol: 0.5, unit: "sq ft", explain: "A=60, B=40, total = 60+40 = 100 sq ft." },
  { topic: "L-Shape", level: "medium", prompt: "A = 12×8, B = 6×7. Total area?", answer: 138, tol: 0.5, unit: "sq ft", explain: "A=96, B=42, total = 138 sq ft." },
  { topic: "L-Shape", level: "hard", prompt: "A = 14×9, B = 10×5.5. Total area?", answer: 181, tol: 0.5, unit: "sq ft", explain: "A=126, B=55, total = 181 sq ft." },

  // Path Area
  { topic: "Path Area", level: "easy", prompt: "Path is 20 ft long, average width 4 ft. Area?", answer: 80, tol: 0.5, unit: "sq ft", explain: "Area = length × avg width = 20 × 4 = 80 sq ft." },
  { topic: "Path Area", level: "medium", prompt: "Path 36 ft long. Widths: 3, 4, 5 ft. Area?", answer: 144, tol: 0.5, unit: "sq ft", explain: "Avg width = (3+4+5)÷3 = 4. Area = 36 × 4 = 144 sq ft." },
  { topic: "Path Area", level: "hard", prompt: "Path 42.5 ft long. Widths: 3.5, 4, 4.5 ft. Area?", answer: 170, tol: 0.5, unit: "sq ft", explain: "Avg = 4. Area = 42.5 × 4 = 170 sq ft." },

  // Curved Path Length
  { topic: "Curved Path Length", level: "easy", prompt: "Your measuring wheel reads 25 ft after rolling a curve. Length?", answer: 25, tol: 0.5, unit: "ft", explain: "The wheel gives the true center-line length: 25 ft." },
  { topic: "Curved Path Length", level: "medium", prompt: "Segment method: pieces measure 3, 4, 3, 2, 4 ft. Total length?", answer: 16, tol: 0.5, unit: "ft", explain: "3+4+3+2+4 = 16 ft." },
  { topic: "Curved Path Length", level: "hard", prompt: "Curve longer than your 25 ft tape: first pull 25 ft, mark it, then 18 ft more. Total length?", answer: 43, tol: 0.5, unit: "ft", explain: "25 + 18 = 43 ft." },

  // Trapezoid
  { topic: "Trapezoid", level: "easy", prompt: "Top 10 ft, bottom 14 ft, height 6 ft. Area?", answer: 72, tol: 0.5, unit: "sq ft", explain: "(10+14)÷2 × 6 = 12 × 6 = 72 sq ft." },
  { topic: "Trapezoid", level: "medium", prompt: "Top 12 ft, bottom 18 ft, height 8 ft. Area?", answer: 120, tol: 0.5, unit: "sq ft", explain: "(12+18)÷2 × 8 = 15 × 8 = 120 sq ft." },
  { topic: "Trapezoid", level: "hard", prompt: "Top 9.5 ft, bottom 15.5 ft, height 7 ft. Area?", answer: 87.5, tol: 0.5, unit: "sq ft", explain: "(9.5+15.5)÷2 × 7 = 12.5 × 7 = 87.5 sq ft." },

  // Angled Corners
  { topic: "Angled Corners", level: "easy", prompt: "Rect 10×8, one 2×2 clip. Net area?", answer: 78, tol: 0.5, unit: "sq ft", explain: "Full=80, clip=½×2×2=2, net = 78 sq ft." },
  { topic: "Angled Corners", level: "medium", prompt: "Rect 12×10, clip 3×2. Net area?", answer: 117, tol: 0.5, unit: "sq ft", explain: "Full=120, clip=½×3×2=3, net = 117 sq ft." },
  { topic: "Angled Corners", level: "hard", prompt: "Rect 14×9, two clips: 2×2 and 3×1.5. Net area (round to 1 decimal)?", answer: 121.8, tol: 0.3, unit: "sq ft", explain: "Full=126, clips=2 + 2.25 = 4.25, net = 121.75 → 121.8 sq ft." },

  // Obstacles
  { topic: "Obstacles", level: "easy", prompt: "Gross 100 sq ft, tree well diameter 4 ft (use 3.14). Net area?", answer: 87.4, tol: 0.5, unit: "sq ft", explain: "Tree = ¼×3.14×4² = 12.56. Net = 100 − 12.56 = 87.4 sq ft." },
  { topic: "Obstacles", level: "medium", prompt: "Gross 200, tree dia 6 ft (3.14) + planter 3×2. Net area?", answer: 165.7, tol: 0.5, unit: "sq ft", explain: "Tree=¼×3.14×36=28.3, planter=6, total deduct=34.3. Net=200−34.3=165.7 sq ft." },
  { topic: "Obstacles", level: "hard", prompt: "Gross 300, tree dia 5 ft (3.14), post pad 1×1, planter 4×3. Net area?", answer: 267.4, tol: 0.6, unit: "sq ft", explain: "Tree=¼×3.14×25=19.6, pad=1, planter=12, deduct=32.6. Net=300−32.6=267.4 sq ft." },

  // Square Check
  { topic: "Square Check", level: "easy", prompt: "Both diagonals of a rectangle read 10 ft. Is it square? (1 = yes, 0 = no)", answer: 1, tol: 0, unit: "", explain: "Equal diagonals → corners are square (90°)." },
  { topic: "Square Check", level: "medium", prompt: "3-4-5 check: 3 ft on one side, 4 ft on the other. What should the diagonal read in ft?", answer: 5, tol: 0.2, unit: "ft", explain: "3²+4² = 25, √25 = 5 ft for a true right angle." },
  { topic: "Square Check", level: "hard", prompt: "Scaled 3-4-5: 6 ft and 8 ft legs. What's the diagonal in ft?", answer: 10, tol: 0.2, unit: "ft", explain: "6²+8² = 100, √100 = 10 ft." },
];

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
    return p.length ? p : QUESTIONS;
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
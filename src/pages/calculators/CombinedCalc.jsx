import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Minus } from "lucide-react";
import CalcShell from "@/components/CalcShell";
import MeasurementInput from "@/components/MeasurementInput";
import { ResultCard, FormulaBreakdown } from "@/components/ResultCard";
import { PI, formatValue } from "@/lib/measurementUtils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import VisualPlan from "@/components/VisualPlan";
import ExportBar from "@/components/ExportBar";
import SaveToProject from "@/components/SaveToProject";
import DeductionPanel from "@/components/DeductionPanel";
import { activeDeductionArea } from "@/lib/deductionUtils";

const SHAPE_TYPES = [
  { value: "rectangle", label: "Rectangle", needs: ["length", "width"] },
  { value: "half", label: "Half Circle", needs: ["radius"] },
  { value: "quarter", label: "Quarter Circle", needs: ["radius"] },
  { value: "circle", label: "Full Circle", needs: ["radius"] },
  { value: "triangle", label: "Triangle", needs: ["base", "height"] },
  { value: "trapezoid", label: "Trapezoid", needs: ["a", "b", "height"] },
  { value: "path", label: "Path / Walk", needs: ["linear", "width"] },
];

// Obstacle presets: named things you keep & work around.
// kind drives the area formula; needs drives which params are shown.
const DEDUCT_PRESETS = [
  { name: "Rectangle", kind: "rect", needs: ["length", "width"] },
  { name: "Square", kind: "square", needs: ["side"] },
  { name: "Triangle", kind: "triangle", needs: ["base", "height"] },
  { name: "Full Circle", kind: "circle", needs: ["radius"] },
  { name: "Half Circle", kind: "half", needs: ["radius"] },
  { name: "Quarter Circle", kind: "quarter", needs: ["radius"] },
  { name: "Planter Bed", kind: "rect", needs: ["length", "width"] },
  { name: "Section Cut-Off", kind: "rect", needs: ["length", "width"] },
  { name: "Corner Notch", kind: "triangle", needs: ["base", "height"] },
  { name: "Tree", kind: "circle", needs: ["diameter"] },
  { name: "Light Post", kind: "circle", needs: ["diameter"] },
  { name: "Electrical Unit", kind: "rect", needs: ["length", "width"] },
  { name: "AC Unit", kind: "rect", needs: ["length", "width"] },
  { name: "Fence", kind: "rect", needs: ["length", "width"] },
  { name: "Path / Walk", kind: "path", needs: ["linear", "width"] },
];
const presetByName = (nm) => DEDUCT_PRESETS.find((p) => p.name === nm);

let _id = 0;
const uid = () => `${Date.now()}-${_id++}`;

function shapeGross(type, p) {
  switch (type) {
    case "rectangle": return (p.length || 0) * (p.width || 0);
    case "half": return 0.5 * PI * (p.radius || 0) ** 2;
    case "quarter": return 0.25 * PI * (p.radius || 0) ** 2;
    case "circle": return PI * (p.radius || 0) ** 2;
    case "triangle": return 0.5 * (p.base || 0) * (p.height || 0);
    case "trapezoid": return ((p.a || 0) + (p.b || 0)) / 2 * (p.height || 0);
    case "path": return (p.linear || 0) * (p.width || 0);
    default: return 0;
  }
}
function shapeLinear(type, p) {
  if (type === "path") return p.linear || 0;
  return 0;
}
function shapeFormula(type, p, gross) {
  switch (type) {
    case "rectangle": return `${fmt(p.length)} × ${fmt(p.width)} = ${fmt(gross)}`;
    case "half": return `½ × ${PI} × ${fmt(p.radius)}² = ${fmt(gross)}`;
    case "quarter": return `¼ × ${PI} × ${fmt(p.radius)}² = ${fmt(gross)}`;
    case "circle": return `${PI} × ${fmt(p.radius)}² = ${fmt(gross)}`;
    case "triangle": return `½ × ${fmt(p.base)} × ${fmt(p.height)} = ${fmt(gross)}`;
    case "trapezoid": return `(${fmt(p.a)} + ${fmt(p.b)}) ÷ 2 × ${fmt(p.height)} = ${fmt(gross)}`;
    case "path": return `${fmt(p.linear)} lin ft × ${fmt(p.width)} ft wide = ${fmt(gross)} sq ft`;
    default: return "";
  }
}
function deductArea(kind, p) {
  switch (kind) {
    case "circle": return p.diameter ? PI * ((p.diameter || 0) / 2) ** 2 : PI * (p.radius || 0) ** 2;
    case "half": return 0.5 * PI * (p.radius || 0) ** 2;
    case "quarter": return 0.25 * PI * (p.radius || 0) ** 2;
    case "square": return (p.side || 0) ** 2;
    case "triangle": return 0.5 * (p.base || 0) * (p.height || 0);
    case "path": return (p.linear || 0) * (p.width || 0);
    default: return (p.length || 0) * (p.width || 0); // rect
  }
}
function deductFormula(kind, p, area) {
  switch (kind) {
    case "circle": return p.diameter != null ? `${PI} × (${fmt(p.diameter)}÷2)² = ${fmt(area)}` : `${PI} × ${fmt(p.radius)}² = ${fmt(area)}`;
    case "half": return `½ × ${PI} × ${fmt(p.radius)}² = ${fmt(area)}`;
    case "quarter": return `¼ × ${PI} × ${fmt(p.radius)}² = ${fmt(area)}`;
    case "square": return `${fmt(p.side)} × ${fmt(p.side)} = ${fmt(area)}`;
    case "triangle": return `½ × ${fmt(p.base)} × ${fmt(p.height)} = ${fmt(area)}`;
    case "path": return `${fmt(p.linear)} × ${fmt(p.width)} = ${fmt(area)}`;
    default: return `${fmt(p.length)} × ${fmt(p.width)} = ${fmt(area)}`; // rect
  }
}
const fmt = (n) => formatValue(n || 0, "hundredth");

const STORAGE_KEY = "paver_combined_state_v1";
const loadSections = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.sections) && parsed.sections.length) return parsed.sections;
    }
  } catch {}
  return [{ id: uid(), label: "Section A", type: "rectangle", params: { length: 0, width: 0 }, deductions: [] }];
};

export default function CombinedCalc() {
  const [sections, setSections] = useState(loadSections);
  const [precision] = useState("hundredth");

  // Persist all input so nothing is lost between visits/refreshes.
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ sections })); } catch {}
  }, [sections]);

  const updateSection = (id, patch) =>
    setSections((s) => s.map((sec) => (sec.id === id ? { ...sec, ...patch } : sec)));
  const updateParam = (id, key, val) =>
    setSections((s) => s.map((sec) => (sec.id === id ? { ...sec, params: { ...sec.params, [key]: val } } : sec)));

  const addSection = () => {
    const letter = String.fromCharCode(65 + sections.length);
    setSections((s) => [...s, { id: uid(), label: `Section ${letter}`, type: "rectangle", params: { length: 0, width: 0 }, deductions: [] }]);
  };
  const removeSection = (id) => setSections((s) => s.filter((sec) => sec.id !== id));

  const addDeduct = (secId) =>
    setSections((s) => s.map((sec) => (sec.id === secId ? { ...sec, deductions: [...sec.deductions, { id: uid(), name: "Tree", kind: "circle", params: { diameter: 0 } }] } : sec)));
  const updateDeduct = (secId, did, patch) =>
    setSections((s) => s.map((sec) => (sec.id === secId ? { ...sec, deductions: sec.deductions.map((d) => (d.id === did ? { ...d, ...patch } : d)) } : sec)));
  const updateDeductParam = (secId, did, key, val) =>
    setSections((s) => s.map((sec) => (sec.id === secId ? { ...sec, deductions: sec.deductions.map((d) => (d.id === did ? { ...d, params: { ...d.params, [key]: val } } : d)) } : sec)));
  const removeDeduct = (secId, did) =>
    setSections((s) => s.map((sec) => (sec.id === secId ? { ...sec, deductions: sec.deductions.filter((d) => d.id !== did) } : sec)));

  // Per-section setter for the shared DeductionPanel (accepts a function or array).
  const setSectionDeductions = (secId) => (updater) => {
    setSections((s) => s.map((sec) => (sec.id === secId ? { ...sec, deductions: typeof updater === "function" ? updater(sec.deductions) : updater } : sec)));
  };

  const computed = sections.map((sec) => {
    const gross = shapeGross(sec.type, sec.params);
    const deductions = sec.deductions.map((d) => ({ ...d, area: deductArea(d.kind, d.params, d.quantity || 1) }));
    const totalDeduct = activeDeductionArea(sec.deductions);
    return { ...sec, gross, deductions, totalDeduct, net: Math.max(0, gross - totalDeduct) };
  });
  const grandGross = computed.reduce((s, sec) => s + sec.gross, 0);
  const grandDeduct = computed.reduce((s, sec) => s + sec.totalDeduct, 0);
  const grandNet = computed.reduce((s, sec) => s + sec.net, 0);
  const grandLinear = computed.reduce((s, sec) => s + shapeLinear(sec.type, sec.params), 0);
  const exportRef = useRef(null);

  return (
    <CalcShell title="Combined Section + Deduct" subtitle="Build up shapes, deduct obstacles per section" icon={Plus}>
      <div className="space-y-5">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
          Add a shape per section (rectangle, half/quarter/full circle, triangle, trapezoid), then deduct obstacles like trees or planters. Each section shows gross, deductions, and net area — all roll up to a project total.
        </div>

        {computed.map((sec) => {
          const shape = SHAPE_TYPES.find((t) => t.value === sec.type);
          return (
            <div key={sec.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={sec.label}
                  onChange={(e) => updateSection(sec.id, { label: e.target.value })}
                  className="text-base font-bold h-10 max-w-[160px]"
                />
                <button onClick={() => removeSection(sec.id)} className="ml-auto p-2 text-rose-600 hover:bg-rose-50 rounded-lg">
                  <Trash2 size={18} />
                </button>
              </div>

              <div>
                <Label className="text-sm font-semibold">Shape</Label>
                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  {SHAPE_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => {
                        const fresh = {};
                        t.needs.forEach((k) => (fresh[k] = 0));
                        updateSection(sec.id, { type: t.value, params: fresh });
                      }}
                      className={`text-xs font-semibold py-2 rounded-md ${sec.type === t.value ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {shape.needs.map((k) => (
                  <MeasurementInput
                    key={k}
                    label={labelFor(k)}
                    value={sec.params[k]}
                    onChange={(v) => updateParam(sec.id, k, v)}
                  />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-[10px] uppercase text-slate-500">Gross</div>
                  <div className="font-bold text-slate-800">{fmt(sec.gross)}<span className="text-xs"> sq ft</span></div>
                </div>
                <div className="bg-rose-50 rounded-lg p-2">
                  <div className="text-[10px] uppercase text-rose-500">Deduct</div>
                  <div className="font-bold text-rose-700">{fmt(sec.totalDeduct)}<span className="text-xs"> sq ft</span></div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-2">
                  <div className="text-[10px] uppercase text-emerald-600">Net</div>
                  <div className="font-bold text-emerald-700">{fmt(sec.net)}<span className="text-xs"> sq ft</span></div>
                </div>
              </div>
              {sec.type === "path" && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-1 rounded-md bg-cyan-100 text-cyan-800 font-bold">{fmt(shapeLinear(sec.type, sec.params))} lin ft</span>
                    <span className="text-xs text-slate-500">Use for borders, edging & bullnose</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5 text-xs text-amber-700">
                    Curved path? Roll the measuring wheel along the centerline to get the linear length — same formula works for straight or curved paths.
                  </div>
                </>
              )}
              <div className="text-xs text-slate-500 font-mono bg-slate-50 rounded-md px-2 py-1.5">
                {shapeFormula(sec.type, sec.params, sec.gross)}
              </div>

              <DeductionPanel deductions={sec.deductions} setDeductions={setSectionDeductions(sec.id)} />
            </div>
          );
        })}

        <button
          onClick={addSection}
          className="w-full flex items-center justify-center gap-2 bg-emerald-700 text-white rounded-2xl py-4 font-bold shadow-md active:scale-95 transition"
        >
          <Plus size={20} /> Add Section
        </button>

        <div ref={exportRef} className="space-y-5">
          {computed.length > 0 && <VisualPlan sections={computed} />}

          {/* Project totals */}
          <div className="bg-emerald-800 text-white rounded-2xl p-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wide text-emerald-100">Project Totals</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[10px] uppercase text-emerald-200">Gross</div>
                <div className="text-xl font-extrabold">{fmt(grandGross)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-emerald-200">Deduct</div>
                <div className="text-xl font-extrabold">{fmt(grandDeduct)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-amber-300">Net Total</div>
                <div className="text-xl font-extrabold text-amber-300">{fmt(grandNet)}</div>
              </div>
            </div>
            {grandLinear > 0 && (
              <div className="text-center pt-1 border-t border-emerald-700 mt-1">
                <span className="text-[10px] uppercase text-cyan-300">Path Linear Total: </span>
                <span className="font-extrabold text-cyan-300">{fmt(grandLinear)} lin ft</span>
              </div>
            )}
          </div>

          <FormulaBreakdown
            steps={[
              `Sections: ${computed.length}`,
              `Total gross area = ${fmt(grandGross)} sq ft`,
              `Total deductions = ${fmt(grandDeduct)} sq ft`,
              `Net project area = ${fmt(grandGross)} − ${fmt(grandDeduct)} = ${fmt(grandNet)} sq ft`,
            ]}
          />
        </div>

        {/* Save & export */}
        <SaveToProject sections={computed} />
        <ExportBar targetRef={exportRef} sections={computed} fileBase="combined-sections" />
      </div>
    </CalcShell>
  );
}

function labelFor(key) {
  const map = {
    length: "Length",
    width: "Width",
    radius: "Radius",
    base: "Base",
    height: "Height",
    a: "Side A (top)",
    b: "Side B (bottom)",
    diameter: "Diameter",
    linear: "Linear Length (along path)",
    side: "Side",
    width: "Width",
  };
  return map[key] || key;
}
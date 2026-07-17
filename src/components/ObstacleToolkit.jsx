import React, { useMemo, useState } from "react";
import { ChevronDown, Move } from "lucide-react";
import DeductionPanel from "@/components/DeductionPanel";
import VisualPlan from "@/components/VisualPlan";
import { shapeGross, totalDeductionArea, activeDeductionArea, fmt } from "@/lib/deductionUtils";

// One reusable toolkit dropped into any calculator or the Estimate Builder.
// Combines the obstacle preset editor with the drag-and-drop visualizer, and
// shows gross / deducted / net so the obstacle effect is always visible.
//
// Props:
//   grossArea  number  — the calculator's computed gross area (source of truth)
//   sections   array   — [{id, type, params, label}] shapes to draw in the visualizer
//   deductions array   — obstacle list (owned by parent)
//   setDeductions fn
//   title      string  — optional heading
export default function ObstacleToolkit({
  grossArea = 0,
  sections = [],
  deductions,
  setDeductions,
  title = "Obstacles & Visualizer",
  visualizer,
  onVisualizerChange,
  editable = true,
}) {
  const [open, setOpen] = useState(true);
  const totalDeduct = totalDeductionArea(deductions);
  const activeDeduct = activeDeductionArea(deductions);
  const inactiveCount = deductions.filter((d) => d.subtract === false).length;
  const net = Math.max(0, grossArea - activeDeduct);

  const vizSections = useMemo(() => {
    if (!sections.length) return [];
    return sections.map((s, i) => {
      const gross = shapeGross(s.type, s.params);
      return {
        ...s,
        gross,
        // attach the shared obstacle pool to the first section so they render
        deductions: i === 0 ? deductions.filter((d) => !d.hidden) : [],
        net: Math.max(0, gross - (i === 0 ? activeDeduct : 0)),
      };
    });
  }, [sections, deductions, activeDeduct]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-indigo-50 border-b border-slate-100"
      >
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Move size={18} className="text-white" />
        </div>
        <div className="flex-1 text-left">
          <h2 className="font-bold text-slate-800 text-sm">{title}</h2>
          <p className="text-xs text-slate-500">Add obstacles, drag the scaled plan, see net area.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] uppercase text-slate-400">Net (active deductions)</div>
            <div className="font-extrabold text-indigo-700">{fmt(net)} <span className="text-xs">sf</span></div>
          </div>
          <ChevronDown size={20} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="p-4 space-y-4">
          {/* Gross / deduct / net summary */}
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="text-[10px] uppercase text-slate-500">Gross</div>
              <div className="font-bold text-slate-800">{fmt(grossArea)}<span className="text-xs"> sf</span></div>
            </div>
            <div className="bg-rose-50 rounded-lg p-2">
              <div className="text-[10px] uppercase text-rose-500">Deduct</div>
              <div className="font-bold text-rose-700">−{fmt(activeDeduct)}<span className="text-xs"> sf</span></div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-2">
              <div className="text-[10px] uppercase text-emerald-600">Net</div>
              <div className="font-bold text-emerald-700">{fmt(net)}<span className="text-xs"> sf</span></div>
            </div>
          </div>

          <DeductionPanel deductions={deductions} setDeductions={setDeductions} />

          {inactiveCount > 0 && (
            <div className="text-[11px] text-slate-500 bg-slate-50 rounded-md px-2 py-1.5">
              {inactiveCount} obstacle(s) shown on the plan but not subtracted (toggle off).
            </div>
          )}

          {vizSections.length > 0 && (
            <VisualPlan
              sections={vizSections}
              initialLayout={visualizer}
              onLayoutChange={onVisualizerChange}
              editable={editable}
            />
          )}
        </div>
      )}
    </div>
  );
}
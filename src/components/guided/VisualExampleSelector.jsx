import React from "react";
import GuidedDiagram from "./GuidedDiagram";

const DIFF = {
  Easy: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Complex: "bg-rose-100 text-rose-700 border-rose-200",
};

// Visual example library card grid — shown before a calculator starts measuring.
export default function VisualExampleSelector({ choices, onSelect }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {choices.map((t) => {
        const d = t.difficulty || "Medium";
        return (
          <div key={t.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 flex gap-3">
            <div className="w-20 h-20 shrink-0 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
              <GuidedDiagram diagram={t.diagram} values={t.preview || {}} highlight={null} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-800 text-sm leading-tight">{t.label}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${DIFF[d] || DIFF.Medium}`}>{d}</span>
              </div>
              {t.bestUse && <p className="text-xs text-slate-500 leading-snug mt-0.5">{t.bestUse}</p>}
              {t.requiredMeasurements?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {t.requiredMeasurements.slice(0, 4).map((m) => (
                    <span key={m} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{m}</span>
                  ))}
                  {t.requiredMeasurements.length > 4 && (
                    <span className="text-[10px] text-slate-400 px-1">+{t.requiredMeasurements.length - 4} more</span>
                  )}
                </div>
              )}
              <button onClick={() => onSelect(t.id)} className="mt-2 w-full bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg active:scale-95">
                Start Measuring
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
import React from "react";
import { AlertTriangle } from "lucide-react";

// Displays a result with its formula breakdown.
// props: title, value, unit, formula (string), precision
export function ResultCard({ title, value, unit, formula, precision = "hundredth" }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{title}</div>
      <div className="text-2xl font-bold text-slate-900 mt-1">
        {value}
        {unit && <span className="text-base font-medium text-slate-400 ml-1">{unit}</span>}
      </div>
      {formula && (
        <div className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-md px-2 py-1.5 font-mono">{formula}</div>
      )}
    </div>
  );
}

export function FormulaBreakdown({ steps }) {
  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Calculation Breakdown</div>
      <div className="space-y-1.5">
        {steps.map((step, i) => (
          <div key={i} className="text-sm font-mono text-slate-700 flex gap-2">
            <span className="text-slate-400">{i + 1}.</span>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WarningList({ warnings }) {
  if (!warnings || warnings.length === 0) return null;
  return (
    <div className="bg-amber-50 border border-amber-300 rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-sm mb-1">
        <AlertTriangle size={16} /> Check Before Finalizing
      </div>
      <ul className="list-disc list-inside text-sm text-amber-700 space-y-0.5">
        {warnings.map((w, i) => (
          <li key={i}>{w}</li>
        ))}
      </ul>
    </div>
  );
}
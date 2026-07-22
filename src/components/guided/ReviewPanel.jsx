import React from "react";
import { CheckCircle2, AlertTriangle, Edit, Copy, Plus, BadgeCheck } from "lucide-react";
import SaveToProject from "@/components/SaveToProject";

// Project review before saving.
// results: { gross, deductions, net, linear, wastePercent, wasteAmount, total, formulaSteps, warnings, reviewRows }
export default function ReviewPanel({ config, typeId, values, results, verified, onToggleVerified, onEdit, onDuplicate, onAddAnother }) {
  const section = {
    label: `${config.title}${typeId ? ` — ${typeId}` : ""}`,
    type: config.id,
    params: values,
    deductions: [],
    gross: results.gross,
    totalDeduct: results.deductions,
    net: results.net,
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <h3 className="font-bold text-slate-800 text-base mb-1">Review & Verify</h3>
        <p className="text-xs text-slate-500 mb-3">Check every measurement before saving. Field Measured values are kept at full precision.</p>

        {/* Entered measurements */}
        <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
          {results.reviewRows.map((r, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2.5">
              <span className="text-sm text-slate-600">{r.label}</span>
              <span className={`text-sm font-bold ${r.kind === "net" ? "text-emerald-700" : r.kind === "deduct" ? "text-rose-600" : "text-slate-800"}`}>
                {typeof r.value === "number" ? r.value.toLocaleString("en-US", { maximumFractionDigits: 2 }) : r.value}
                <span className="text-xs font-medium text-slate-400 ml-1">{r.unit}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Formula */}
        {results.formulaSteps?.length > 0 && (
          <div className="mt-3 bg-slate-50 rounded-xl border border-slate-200 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Formula</div>
            <div className="space-y-1">
              {results.formulaSteps.map((s, i) => (
                <div key={i} className="text-xs font-mono text-slate-700 flex gap-2">
                  <span className="text-slate-400">{i + 1}.</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {results.warnings?.length > 0 && (
          <div className="mt-3 bg-amber-50 border border-amber-300 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-sm mb-1">
              <AlertTriangle size={16} /> Check before finalizing
            </div>
            <ul className="list-disc list-inside text-sm text-amber-700 space-y-0.5">
              {results.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}

        {/* Field verified toggle */}
        <button
          onClick={onToggleVerified}
          className={`mt-3 w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold border-2 transition ${
            verified ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-slate-200 text-slate-600"
          }`}
        >
          {verified ? <BadgeCheck size={20} /> : <CheckCircle2 size={20} />}
          {verified ? "Marked as Field Verified" : "Mark as Field Verified"}
        </button>
      </div>

      {/* Save to project */}
      <SaveToProject sections={[section]} />

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2">
        <button onClick={onEdit} className="flex flex-col items-center gap-1 bg-white border border-slate-200 rounded-xl py-3 text-slate-700 active:scale-95">
          <Edit size={18} /><span className="text-xs font-semibold">Edit</span>
        </button>
        <button onClick={onDuplicate} className="flex flex-col items-center gap-1 bg-white border border-slate-200 rounded-xl py-3 text-slate-700 active:scale-95">
          <Copy size={18} /><span className="text-xs font-semibold">Duplicate</span>
        </button>
        <button onClick={onAddAnother} className="flex flex-col items-center gap-1 bg-white border border-slate-200 rounded-xl py-3 text-slate-700 active:scale-95">
          <Plus size={18} /><span className="text-xs font-semibold">Add Another</span>
        </button>
      </div>
    </div>
  );
}
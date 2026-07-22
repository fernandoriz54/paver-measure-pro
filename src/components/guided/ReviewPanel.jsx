import React from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Copy, Plus, Maximize2, BadgeCheck } from "lucide-react";
import SaveToProject from "@/components/SaveToProject";
import ConfidenceBadge from "./ConfidenceBadge";
import VerificationChecklist from "./VerificationChecklist";
import WarningPanel from "./WarningPanel";

// Map a guided config id to the existing visualizer route for "Open in Visualizer".
const VISUALIZER_ROUTE = {
  walkways: "/calc/walkway",
  patios: "/calc/rectangle",
  turf: "/calc/turf",
  driveways: "/calc/driveway",
  borders: "/calc/border",
};

// Project review before saving.
export default function ReviewPanel({
  config, typeId, values, results, verified, confidence, issues, acknowledged,
  checklistQuestions, checklist, onToggleCheck,
  onToggleVerified, onAcknowledge, onFix, onEdit, onDuplicate, onAddAnother,
  estimateReady, onToggleEstimateReady,
}) {
  const navigate = useNavigate();
  const allChecked = checklistQuestions?.length > 0 && checklistQuestions.every((_, i) => checklist[i]);
  const canVerify = allChecked && (issues?.length || 0) === 0;
  const visualizerRoute = VISUALIZER_ROUTE[config?.id];

  return (
    <div className="space-y-4">
      {/* Confidence score */}
      {confidence && <ConfidenceBadge confidence={confidence} />}

      {/* Measurements + formula */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <h3 className="font-bold text-slate-800 text-base mb-1">Review & Verify</h3>
        <p className="text-xs text-slate-500 mb-3">Check every measurement before saving. Field Measured values are kept at full precision.</p>

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
      </div>

      {/* Verification issues (warnings/errors) */}
      {issues && issues.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-700 mb-2 px-1">Verification Checks</h3>
          <WarningPanel issues={issues} onFix={onFix} onAcknowledge={onAcknowledge} acknowledged={acknowledged} />
        </div>
      )}

      {/* Field verification checklist */}
      <VerificationChecklist questions={checklistQuestions} checked={checklist} onToggle={onToggleCheck} />

      {/* Field verified toggle — only enabled when checklist complete and no open issues */}
      <button
        onClick={onToggleVerified}
        disabled={!canVerify && !verified}
        className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-semibold border-2 transition ${
          verified ? "bg-emerald-50 border-emerald-500 text-emerald-700" : canVerify ? "bg-white border-slate-300 text-slate-600 active:scale-95" : "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
        }`}
      >
        {verified ? "✓ Marked as Field Verified" : canVerify ? "Mark as Field Verified" : "Complete checklist & resolve issues to verify"}
      </button>

      {/* Save to project */}
      <SaveToProject sections={[{
        label: `${config.title}${typeId ? ` — ${typeId}` : ""}`,
        type: config.id,
        params: values,
        deductions: [],
        gross: results.gross,
        totalDeduct: results.deductions,
        net: results.net,
      }]} />

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button onClick={onEdit} className="flex flex-col items-center gap-1 bg-white border border-slate-200 rounded-xl py-3 text-slate-700 active:scale-95">
          <Edit size={18} /><span className="text-xs font-semibold">Edit</span>
        </button>
        <button onClick={onDuplicate} className="flex flex-col items-center gap-1 bg-white border border-slate-200 rounded-xl py-3 text-slate-700 active:scale-95">
          <Copy size={18} /><span className="text-xs font-semibold">Duplicate</span>
        </button>
        <button onClick={onAddAnother} className="flex flex-col items-center gap-1 bg-white border border-slate-200 rounded-xl py-3 text-slate-700 active:scale-95">
          <Plus size={18} /><span className="text-xs font-semibold">Add Another</span>
        </button>
        {visualizerRoute && (
          <button onClick={() => navigate(visualizerRoute)} className="flex flex-col items-center gap-1 bg-white border border-slate-200 rounded-xl py-3 text-slate-700 active:scale-95">
            <Maximize2 size={18} /><span className="text-xs font-semibold">Visualizer</span>
          </button>
        )}
      </div>

      {/* Mark Estimate Ready */}
      {onToggleEstimateReady && (
        <button
          onClick={onToggleEstimateReady}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-semibold border-2 transition ${
            estimateReady ? "bg-violet-50 border-violet-500 text-violet-700" : "bg-white border-slate-300 text-slate-600 active:scale-95"
          }`}
        >
          <BadgeCheck size={20} /> {estimateReady ? "Marked Estimate Ready" : "Mark Estimate Ready"}
        </button>
      )}
    </div>
  );
}
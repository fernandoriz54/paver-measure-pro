import React from "react";
import { AlertTriangle, Wrench, MapPin } from "lucide-react";

// "Show me where to measure" help panel for a single step.
// help: { where, text, example, mistake, tool }
export default function HelpCard({ help }) {
  if (!help) return null;
  return (
    <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-2.5">
      <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
        <MapPin size={16} /> Where to measure
      </div>
      {help.where && <p className="text-sm text-amber-900">{help.where}</p>}
      {help.text && <p className="text-sm text-slate-700">{help.text}</p>}
      {help.example && (
        <div className="text-sm text-slate-700">
          <span className="font-semibold text-slate-900">Example: </span>
          {help.example}
        </div>
      )}
      {help.mistake && (
        <div className="flex items-start gap-1.5 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span><span className="font-semibold">Common mistake: </span>{help.mistake}</span>
        </div>
      )}
      {help.tool && (
        <div className="flex items-center gap-1.5 text-sm text-emerald-800">
          <Wrench size={15} /> <span className="font-semibold">Field tool: </span>{help.tool}
        </div>
      )}
    </div>
  );
}
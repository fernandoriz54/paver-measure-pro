import React, { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";

// Context-specific field verification checklist shown before marking complete.
export default function VerificationChecklist({ questions, checked, onToggle }) {
  const [open, setOpen] = useState(true);
  if (!questions?.length) return null;
  const done = questions.filter((_, i) => checked[i]).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-4 py-3">
        <span className="font-bold text-slate-800 text-sm">Field Verification Checklist</span>
        <span className="text-xs font-semibold text-slate-500">{done}/{questions.length} confirmed</span>
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-1.5">
          <p className="text-xs text-slate-500 mb-1">Confirm each before marking this section Field Verified.</p>
          {questions.map((q, i) => (
            <button
              key={i}
              onClick={() => onToggle(i)}
              className={`w-full flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-left border transition ${
                checked[i] ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50"
              }`}
            >
              {checked[i] ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" /> : <Circle size={18} className="text-slate-400 shrink-0 mt-0.5" />}
              <span className={`text-sm ${checked[i] ? "text-emerald-800 font-medium" : "text-slate-700"}`}>{q}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
import React, { useState } from "react";
import { ChevronDown, Settings2 } from "lucide-react";

// Collapsible panel for optional / advanced features (deductions, obstacles,
// material selection, verification, formula breakdown, etc.).
// Renders collapsed by default so the Quick Measure screen stays compact.
export default function AdvancedDetails({ title = "Advanced Details", summary, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left active:scale-[0.99] transition"
      >
        <Settings2 size={18} className="text-slate-500" />
        <span className="flex-1">
          <span className="block font-bold text-slate-700 text-sm">{title}</span>
          {summary && <span className="block text-xs text-slate-400 leading-snug">{summary}</span>}
        </span>
        <ChevronDown size={18} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-3">{children}</div>}
    </div>
  );
}
import React, { useState } from "react";
import { Eye, X } from "lucide-react";
import HelpDiagram from "./HelpDiagram";

// Optional "Show Me How to Measure" overlay. Opens on demand, never blocks the workflow.
// props: diagramType, where, explanation, mistake
export default function VisualHelp({ diagramType = "generic", where, explanation, mistake }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex-1 flex items-center justify-center gap-1.5 bg-sky-700 text-white text-xs font-bold py-2.5 rounded-lg active:scale-95 transition"
      >
        <Eye size={15} /> Show Me How to Measure
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-base">How to Measure</h3>
              <button onClick={() => setOpen(false)} className="p-2 -mr-2 text-slate-400" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 flex justify-center">
              <HelpDiagram type={diagramType} />
            </div>
            <div className="mt-4 space-y-3 text-sm">
              {where && (
                <div>
                  <div className="font-semibold text-slate-700 mb-0.5">Where to measure</div>
                  <p className="text-slate-600 leading-snug">{where}</p>
                </div>
              )}
              {explanation && (
                <div>
                  <div className="font-semibold text-slate-700 mb-0.5">Explanation</div>
                  <p className="text-slate-600 leading-snug">{explanation}</p>
                </div>
              )}
              {mistake && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="font-semibold text-amber-800 mb-0.5">Common mistake</div>
                  <p className="text-amber-700 text-xs leading-snug">{mistake}</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-full mt-4 bg-slate-800 text-white font-bold py-3 rounded-xl active:scale-95"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
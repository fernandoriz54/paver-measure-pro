import React from "react";
import { useNavigate } from "react-router-dom";
import { Compass } from "lucide-react";
import VisualHelp from "./VisualHelp";
import { VISUAL_HELP } from "@/lib/visualHelp";

// Compact toolbar shown at the top of every Quick Measure screen.
// - "Show Me How to Measure" opens the optional Visual Help overlay.
// - "Guide Me Step by Step" (only when guidedId is provided) opens the
//   step-by-step guided flow — never required to calculate or save.
export default function QuickMeasureBar({ helpId, guidedId }) {
  const navigate = useNavigate();
  const help = helpId ? VISUAL_HELP[helpId] : null;
  return (
    <div className="flex gap-2">
      {help ? (
        <VisualHelp {...help} />
      ) : (
        <span className="flex-1" />
      )}
      {guidedId && (
        <button
          type="button"
          onClick={() => navigate(`/guided/${guidedId}`)}
          className="flex-1 flex items-center justify-center gap-1.5 border border-slate-300 text-slate-700 text-xs font-bold py-2.5 rounded-lg active:scale-95 transition"
        >
          <Compass size={15} /> Guide Me Step by Step
        </button>
      )}
    </div>
  );
}
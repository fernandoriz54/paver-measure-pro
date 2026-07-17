import React from "react";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { stepCalc, num, inchToFeet } from "@/lib/entranceUtils";
import { formatValue } from "@/lib/measurementUtils";

// Single step input row — every step has its own measurements.
export default function StepRow({ step, index, onChange, onRemove }) {
  const c = stepCalc(step);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-bold text-emerald-800">Step {index + 1}</span>
        <button onClick={onRemove} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
          <Trash2 size={16} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs">Width (ft)</Label>
          <Input type="number" inputMode="decimal" value={step.width}
            onChange={(e) => onChange("width", e.target.value)} className="h-11 text-base" />
        </div>
        <div>
          <Label className="text-xs">Tread (in)</Label>
          <Input type="number" inputMode="decimal" value={step.treadDepthIn}
            onChange={(e) => onChange("treadDepthIn", e.target.value)} className="h-11 text-base" />
        </div>
        <div>
          <Label className="text-xs">Riser (in)</Label>
          <Input type="number" inputMode="decimal" value={step.riserHeightIn}
            onChange={(e) => onChange("riserHeightIn", e.target.value)} className="h-11 text-base" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Left return (ft)</Label>
          <Input type="number" inputMode="decimal" value={step.leftReturn}
            onChange={(e) => onChange("leftReturn", e.target.value)} className="h-11 text-base" />
        </div>
        <div>
          <Label className="text-xs">Right return (ft)</Label>
          <Input type="number" inputMode="decimal" value={step.rightReturn}
            onChange={(e) => onChange("rightReturn", e.target.value)} className="h-11 text-base" />
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-xs">
        <label className="flex items-center gap-1.5">
          <Checkbox checked={step.frontEdge} onCheckedChange={(v) => onChange("frontEdge", v)} />
          Front bullnose edge
        </label>
        <label className="flex items-center gap-1.5">
          <Checkbox checked={step.includeLeftSide} onCheckedChange={(v) => onChange("includeLeftSide", v)} />
          Left side face
        </label>
        <label className="flex items-center gap-1.5">
          <Checkbox checked={step.includeRightSide} onCheckedChange={(v) => onChange("includeRightSide", v)} />
          Right side face
        </label>
      </div>
      <Input placeholder="Notes for this step" value={step.notes}
        onChange={(e) => onChange("notes", e.target.value)} className="h-10 text-sm" />
      <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-500 bg-slate-50 rounded-md p-2">
        <span>Tread: <b>{formatValue(c.treadArea, "hundredth")}</b> sf</span>
        <span>Riser: <b>{formatValue(c.riserArea, "hundredth")}</b> sf</span>
        <span>Bullnose: <b>{formatValue(c.bullnoseLinear, "hundredth")}</b> lin ft</span>
      </div>
    </div>
  );
}
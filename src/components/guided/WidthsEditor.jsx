import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import MeasurementInput from "@/components/MeasurementInput";

// Station-width editor for changing-width walkways.
// value: array of widths (ft). onChange(newArray).
export default function WidthsEditor({ label, value, onChange, min = 2 }) {
  const w = Array.isArray(value) ? value : [];
  const set = (i, v) => {
    const next = [...w];
    while (next.length <= i) next.push(0);
    next[i] = v;
    onChange(next);
  };
  const add = () => onChange([...w, 0]);
  const remove = (i) => onChange(w.filter((_, idx) => idx !== i));
  const rows = w.length >= (min || 0) ? w : Array.from({ length: min }, () => 0);

  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">{label}</Label>
      <p className="text-xs text-slate-500">Enter the width at each station along the path, start to end.</p>
      {rows.map((val, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 w-16 shrink-0">Station {i + 1}</span>
          <div className="flex-1"><MeasurementInput label="" value={val} onChange={(v) => set(i, v)} /></div>
          {rows.length > (min || 1) && (
            <button onClick={() => remove(i)} className="text-rose-500 p-1" aria-label="Remove station"><Trash2 size={16} /></button>
          )}
        </div>
      ))}
      <button onClick={add} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl py-3 text-slate-600 font-semibold active:scale-95">
        <Plus size={18} /> Add Station
      </button>
    </div>
  );
}
import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import MeasurementInput from "@/components/MeasurementInput";

// Repeating rectangular-section editor for patios/turf/driveways.
// value: array of { length, width }. onChange(newArray). Labels color-coded A, B, C…
export default function SectionAreaEditor({ label, value, onChange, min = 1 }) {
  const segs = Array.isArray(value) ? value : [];
  const ensure = (n) => {
    const next = [...segs];
    while (next.length < n) next.push({ length: 0, width: 0 });
    return next.slice(0, Math.max(n, 0));
  };
  const set = (i, patch) => {
    const next = ensure(Math.max(segs.length, i + 1));
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const add = () => onChange([...ensure(segs.length), { length: 0, width: 0 }]);
  const remove = (i) => onChange(ensure(segs.length).filter((_, idx) => idx !== i));
  const rows = ensure(Math.max(segs.length, min || 0));
  const COLORS = ["bg-sky-100 text-sky-700", "bg-emerald-100 text-emerald-700", "bg-amber-100 text-amber-700", "bg-violet-100 text-violet-700", "bg-rose-100 text-rose-700"];

  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">{label}</Label>
      {rows.map((seg, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${COLORS[i % COLORS.length]}`}>Section {String.fromCharCode(65 + i)}</span>
            {rows.length > (min || 1) && (
              <button onClick={() => remove(i)} className="text-rose-500 p-1" aria-label="Remove section"><Trash2 size={16} /></button>
            )}
          </div>
          <MeasurementInput label="Length (ft)" value={seg.length} onChange={(v) => set(i, { length: v })} />
          <MeasurementInput label="Width (ft)" value={seg.width} onChange={(v) => set(i, { width: v })} />
        </div>
      ))}
      <button onClick={add} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl py-3 text-slate-600 font-semibold active:scale-95">
        <Plus size={18} /> Add Section
      </button>
    </div>
  );
}
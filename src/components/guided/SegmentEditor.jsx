import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import MeasurementInput from "@/components/MeasurementInput";

// Repeating wall-segment editor: each row = length (ft) + visible height (ft).
// value: array of { length, height }. onChange(newArray).
export default function SegmentEditor({ label, value, onChange, count }) {
  const segs = Array.isArray(value) ? value : [];
  const ensure = (n) => {
    const next = [...segs];
    while (next.length < n) next.push({ length: 0, height: 0 });
    return next.slice(0, Math.max(n, 0));
  };
  const set = (i, patch) => {
    const next = ensure(Math.max(segs.length, i + 1));
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const add = () => onChange([...ensure(segs.length), { length: 0, height: 0 }]);
  const remove = (i) => onChange(ensure(segs.length).filter((_, idx) => idx !== i));

  const rows = ensure(Math.max(segs.length, count || 0));

  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">{label}</Label>
      {rows.map((seg, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Segment {String.fromCharCode(65 + i)}</span>
            <button onClick={() => remove(i)} className="text-rose-500 p-1" aria-label="Remove segment">
              <Trash2 size={16} />
            </button>
          </div>
          <MeasurementInput label="Length (decimal ft out)" value={seg.length} onChange={(v) => set(i, { length: v })} />
          <MeasurementInput label="Visible height" value={seg.height} onChange={(v) => set(i, { height: v })} />
        </div>
      ))}
      <button onClick={add} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl py-3 text-slate-600 font-semibold active:scale-95">
        <Plus size={18} /> Add Segment
      </button>
    </div>
  );
}
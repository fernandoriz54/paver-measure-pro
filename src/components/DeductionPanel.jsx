import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  DEDUCT_PRESETS,
  presetByName,
  deductArea,
  deductFormula,
  deductLabelFor,
  fmt,
  newDeduction,
} from "@/lib/deductionUtils";

// Reusable obstacle/deduction editor. Owns nothing — parent holds the `deductions`
// array and gets add/update/remove via setDeductions.
export default function DeductionPanel({ deductions, setDeductions }) {
  const add = () => setDeductions((prev) => [...prev, newDeduction("Tree")]);
  const update = (id, patch) =>
    setDeductions((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const updateParam = (id, key, val) =>
    setDeductions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, params: { ...d.params, [key]: val } } : d))
    );
  const remove = (id) => setDeductions((prev) => prev.filter((d) => d.id !== id));

  const total = deductions.reduce((sum, d) => sum + deductArea(d.kind, d.params), 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-600">Obstacles / Deductions</span>
        <button
          onClick={add}
          className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
        >
          <Plus size={14} /> Add obstacle
        </button>
      </div>

      {deductions.length === 0 && (
        <div className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2 border border-dashed border-slate-200">
          No obstacles yet — tap “Add obstacle” to deduct trees, planters, posts, etc.
        </div>
      )}

      {deductions.map((d) => {
        const preset = presetByName(d.name);
        return (
          <div key={d.id} className="bg-rose-50/60 border border-rose-200 rounded-lg p-2 space-y-2">
            <div className="flex items-center gap-2">
              <select
                value={d.name}
                onChange={(e) => {
                  const np = presetByName(e.target.value);
                  const fresh = {};
                  np.needs.forEach((k) => (fresh[k] = 0));
                  update(d.id, { name: e.target.value, kind: np.kind, params: fresh });
                }}
                className="text-xs font-semibold h-9 rounded-md border border-input bg-white px-2 flex-1"
              >
                {DEDUCT_PRESETS.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
              <button onClick={() => remove(d.id)} className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {preset.needs.map((k) => (
                <div key={k}>
                  <Label className="text-xs">{deductLabelFor(k)}</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={d.params[k]}
                    onChange={(e) => updateParam(d.id, k, parseFloat(e.target.value) || 0)}
                    className="h-9 text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="text-xs text-rose-600 font-mono">
              −{deductFormula(d.kind, d.params, deductArea(d.kind, d.params))} sq ft
            </div>
          </div>
        );
      })}

      {deductions.length > 0 && (
        <div className="flex items-center justify-between bg-rose-100 rounded-lg px-3 py-1.5 text-xs">
          <span className="font-semibold text-rose-700">Total deducted</span>
          <span className="font-extrabold text-rose-700">−{fmt(total)} sq ft</span>
        </div>
      )}
    </div>
  );
}
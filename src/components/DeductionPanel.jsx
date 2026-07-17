import React, { useState } from "react";
import { Plus, Trash2, Copy, Star, Eye, EyeOff, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import MeasurementInput from "@/components/MeasurementInput";
import ObstacleSelector from "@/components/ObstacleSelector";
import {
  DEDUCT_COLORS,
  DEDUCT_PRESETS,
  presetByName,
  deductArea,
  deductFormula,
  deductLabelFor,
  fmt,
  newDeduction,
  detectDuplicates,
} from "@/lib/deductionUtils";

const FAV_KEY = "paver_obs_fav";
const loadFav = () => { try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch { return []; } };
const saveFav = (a) => { try { localStorage.setItem(FAV_KEY, JSON.stringify(a)); } catch {} };

// Reusable obstacle/deduction editor. Parent owns the `deductions` array and
// receives add/update/remove via setDeductions (React setState — accepts a
// function or a value, so per-section wrappers work too).
export default function DeductionPanel({ deductions, setDeductions, title }) {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [fav, setFav] = useState(loadFav);

  const add = (name) => setDeductions((prev) => [...prev, newDeduction(name)]);
  const update = (id, patch) => setDeductions((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const updateParam = (id, key, val) =>
    setDeductions((prev) => prev.map((d) => (d.id === id ? { ...d, params: { ...d.params, [key]: val } } : d)));
  const setParams = (id, partial) =>
    setDeductions((prev) => prev.map((d) => (d.id === id ? { ...d, params: { ...d.params, ...partial } } : d)));
  const remove = (id) => setDeductions((prev) => prev.filter((d) => d.id !== id));
  const duplicate = (id) =>
    setDeductions((prev) => {
      const src = prev.find((d) => d.id === id);
      if (!src) return prev;
      const copy = { ...src, id: `d${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, label: `${src.label || src.name} (copy)`, favorite: false };
      return [...prev, copy];
    });
  const toggleFav = (d) => {
    update(d.id, { favorite: !d.favorite });
    setFav((prev) => {
      const has = prev.includes(d.name);
      const next = has ? prev.filter((n) => n !== d.name) : [...prev, d.name];
      saveFav(next);
      return next;
    });
  };

  const dupWarnings = detectDuplicates(deductions);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-600">{title || "Obstacles / Deductions"}</span>
        <button
          onClick={() => setSelectorOpen(true)}
          className="flex items-center gap-1.5 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg px-3 py-2 active:scale-95 transition"
        >
          <Plus size={16} /> Add obstacle
        </button>
      </div>

      <ObstacleSelector open={selectorOpen} onClose={() => setSelectorOpen(false)} onPick={add} />

      {deductions.length === 0 && (
        <div className="text-sm text-slate-500 bg-slate-50 rounded-xl px-4 py-6 border border-dashed border-slate-200 text-center">
          No obstacles or deductions added yet.
        </div>
      )}

      {deductions.map((d) => {
        const area = deductArea(d.kind, d.params, d.quantity || 1);
        const qty = d.quantity || 1;
        return (
          <div
            key={d.id}
            className={`rounded-xl border p-3 space-y-2.5 ${d.hidden ? "border-slate-200 bg-slate-50/60 opacity-70" : "border-slate-200 bg-white"}`}
            style={{ borderLeftWidth: 4, borderLeftColor: d.color || "#dc2626" }}
          >
            {/* Header */}
            <div className="flex items-center gap-2">
              <select
                value={d.name}
                onChange={(e) => {
                  const np = presetByName(e.target.value);
                  const fresh = {};
                  np.needs.forEach((k) => (fresh[k] = 0));
                  update(d.id, { name: e.target.value, label: e.target.value, kind: np.kind, params: fresh });
                }}
                className="text-xs font-semibold h-9 rounded-md border border-input bg-white px-2 flex-1"
              >
                {DEDUCT_PRESETS.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
              <button onClick={() => toggleFav(d)} className={`p-1.5 rounded-lg ${d.favorite ? "text-amber-500" : "text-slate-300 hover:text-amber-500"}`} title="Save as favorite">
                <Star size={16} className={d.favorite ? "fill-amber-400" : ""} />
              </button>
              <button onClick={() => duplicate(d.id)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg" title="Duplicate">
                <Copy size={16} />
              </button>
              <button onClick={() => update(d.id, { hidden: !d.hidden })} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg" title={d.hidden ? "Show" : "Hide"}>
                {d.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button onClick={() => remove(d.id)} className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg" title="Delete">
                <Trash2 size={16} />
              </button>
            </div>

            {/* Custom label */}
            <div>
              <Label className="text-xs text-slate-500">Custom label</Label>
              <Input
                value={d.label || ""}
                onChange={(e) => update(d.id, { label: e.target.value })}
                placeholder={d.name}
                className="h-9 text-sm"
              />
            </div>

            {/* Shape-based measurement fields */}
            {!d.hidden && (
              <ShapeFields d={d} updateParam={(k, v) => updateParam(d.id, k, v)} setParams={(partial) => setParams(d.id, partial)} />
            )}

            {/* Quantity */}
            <div className="flex items-center gap-2">
              <Label className="text-xs text-slate-500 whitespace-nowrap">Quantity</Label>
              <Input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => update(d.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                className="h-9 w-24 text-sm"
              />
            </div>

            {/* Live area + formula */}
            <div className="bg-rose-50 rounded-lg px-2.5 py-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-rose-700">Calculated area</span>
                <span className="font-extrabold text-rose-700">−{fmt(area)} sq ft</span>
              </div>
              <div className="font-mono text-rose-600 mt-0.5">{deductFormula(d.kind, d.params, area, qty)}</div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-2.5 py-1.5">
                <span className="text-xs font-semibold text-slate-600">Subtract from total</span>
                <Switch checked={d.subtract !== false} onCheckedChange={(v) => update(d.id, { subtract: v })} />
              </div>
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-2.5 py-1.5">
                <span className="text-xs font-semibold text-slate-600">Include in report</span>
                <Switch checked={d.includeReport !== false} onCheckedChange={(v) => update(d.id, { includeReport: v })} />
              </div>
            </div>

            {/* Color + notes (collapsible) */}
            <details className="text-xs">
              <summary className="flex items-center gap-1 cursor-pointer text-slate-500 font-semibold select-none">
                <ChevronDown size={14} /> Color, notes & section
              </summary>
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {DEDUCT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => update(d.id, { color: c })}
                      className={`w-5 h-5 rounded-full border-2 ${d.color === c ? "border-slate-800" : "border-white"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Section assignment</Label>
                  <Input
                    value={d.section || ""}
                    onChange={(e) => update(d.id, { section: e.target.value })}
                    placeholder="e.g. Section A, Walkway, Porch"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Notes</Label>
                  <Textarea
                    value={d.notes || ""}
                    onChange={(e) => update(d.id, { notes: e.target.value })}
                    placeholder="Location, condition, verification…"
                    className="text-sm min-h-[60px]"
                  />
                </div>
              </div>
            </details>
          </div>
        );
      })}

      {dupWarnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-2.5 text-xs text-amber-800 space-y-1">
          {dupWarnings.map((w, i) => (
            <div key={i}>⚠ {w}</div>
          ))}
        </div>
      )}

      {deductions.length > 0 && (
        <div className="flex items-center justify-between bg-rose-100 rounded-lg px-3 py-1.5 text-xs">
          <span className="font-semibold text-rose-700">Total deducted</span>
          <span className="font-extrabold text-rose-700">−{fmt(deductions.reduce((s, d) => s + deductArea(d.kind, d.params, d.quantity || 1), 0))} sq ft</span>
        </div>
      )}
    </div>
  );
}

function ShapeFields({ d, updateParam, setParams }) {
  const u = (k, v) => updateParam(k, v);
  switch (d.kind) {
    case "circle":
      return <CircleFields d={d} setParams={setParams} />;
    case "half":
    case "quarter":
      return <MeasurementInput label="Radius" value={d.params.radius} onChange={(v) => u("radius", v)} defaultMode="dec" />;
    case "square":
      return <MeasurementInput label="Side" value={d.params.side} onChange={(v) => u("side", v)} defaultMode="dec" />;
    case "triangle":
      return (
        <>
          <MeasurementInput label="Base" value={d.params.base} onChange={(v) => u("base", v)} defaultMode="dec" />
          <MeasurementInput label="Height" value={d.params.height} onChange={(v) => u("height", v)} defaultMode="dec" />
        </>
      );
    case "trapezoid":
      return (
        <>
          <MeasurementInput label="Side A" value={d.params.a} onChange={(v) => u("a", v)} defaultMode="dec" />
          <MeasurementInput label="Side B" value={d.params.b} onChange={(v) => u("b", v)} defaultMode="dec" />
          <MeasurementInput label="Height" value={d.params.height} onChange={(v) => u("height", v)} defaultMode="dec" />
        </>
      );
    case "oval":
      return (
        <>
          <MeasurementInput label="Full Length" value={d.params.length} onChange={(v) => u("length", v)} defaultMode="dec" />
          <MeasurementInput label="Full Width" value={d.params.width} onChange={(v) => u("width", v)} defaultMode="dec" />
        </>
      );
    case "manual":
      return (
        <div>
          <Label className="text-xs text-slate-500">Manually entered field area (sq ft)</Label>
          <Input
            type="number"
            inputMode="decimal"
            value={d.params.area}
            onChange={(e) => u("area", parseFloat(e.target.value) || 0)}
            className="h-10 text-sm"
          />
          <p className="text-[11px] text-amber-600 mt-1">Estimated area — additional field measurements may be required.</p>
        </div>
      );
    case "path":
      return <PathFields d={d} updateParam={u} setParams={setParams} />;
    default:
      return (
        <>
          <MeasurementInput label="Length" value={d.params.length} onChange={(v) => u("length", v)} defaultMode="dec" />
          <MeasurementInput label="Width" value={d.params.width} onChange={(v) => u("width", v)} defaultMode="dec" />
        </>
      );
  }
}

function CircleFields({ d, setParams }) {
  const p = d.params || {};
  const setD = (v) => setParams({ diameter: v, radius: v / 2, circumference: v * 3.1416 });
  const setR = (v) => setParams({ radius: v, diameter: v * 2, circumference: v * 2 * 3.1416 });
  const setC = (v) => { const diam = v / 3.1416; setParams({ circumference: v, diameter: diam, radius: diam / 2 }); };
  return (
    <>
      <MeasurementInput label="Diameter" value={p.diameter} onChange={setD} defaultMode="dec" />
      <MeasurementInput label="Radius" value={p.radius} onChange={setR} defaultMode="dec" />
      <MeasurementInput label="Circumference" value={p.circumference} onChange={setC} defaultMode="dec" />
    </>
  );
}

function PathFields({ d, updateParam, setParams }) {
  const p = d.params || {};
  const widths = Array.isArray(p.widths) && p.widths.length ? p.widths : (p.width ? [p.width] : [0]);
  const avg = widths.reduce((a, b) => a + (parseFloat(b) || 0), 0) / widths.length;
  const setWidths = (arr) => {
    const a = arr.length ? arr.reduce((s, x) => s + (parseFloat(x) || 0), 0) / arr.length : 0;
    setParams({ widths: arr, width: a });
  };
  return (
    <>
      <MeasurementInput label="Linear length (along path)" value={p.linear} onChange={(v) => updateParam("linear", v)} defaultMode="dec" />
      <div className="space-y-1.5">
        {widths.map((w, i) => (
          <div key={i} className="flex gap-1.5 items-end">
            <div className="flex-1">
              <Label className="text-xs text-slate-500">Width #{i + 1}</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={w}
                onChange={(e) => setWidths(widths.map((x, idx) => (idx === i ? e.target.value : x)))}
                className="h-10 text-sm"
              />
            </div>
            {widths.length > 1 && (
              <button onClick={() => setWidths(widths.filter((_, idx) => idx !== i))} className="p-2 text-rose-500" title="Remove width">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
        <button onClick={() => setWidths([...widths, 0])} className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
          <Plus size={12} /> Add width measurement
        </button>
        <p className="text-[11px] text-slate-500">
          Avg width {fmt(avg)} ft × length {fmt(p.linear || 0)} = {fmt((p.linear || 0) * avg)} sq ft.
          Curved path: roll the measuring wheel along the centerline.
        </p>
      </div>
    </>
  );
}
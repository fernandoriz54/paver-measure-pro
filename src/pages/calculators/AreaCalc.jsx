import React, { useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import CalcShell from "@/components/CalcShell";
import MeasurementInput from "@/components/MeasurementInput";
import { ResultCard, FormulaBreakdown, WarningList } from "@/components/ResultCard";
import { applyWaste, validateMeasurements, formatValue } from "@/lib/measurementUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Generic area calculator with multiple sub-sections + a measurement checklist.
// props: title, subtitle, icon, checklist (array of strings)
export default function AreaCalc({ title, subtitle, icon: Icon, checklist = [] }) {
  const [subs, setSubs] = useState([{ id: 1, label: "Main area", length: 0, width: 0 }]);
  const [checked, setChecked] = useState({});
  const [waste, setWaste] = useState(10);
  const [precision] = useState("hundredth");

  const totalArea = subs.reduce((sum, s) => sum + (s.length * s.width), 0);
  const wasteResult = applyWaste(totalArea, waste);
  const warnings = validateMeasurements({ wastePercent: waste }, "area");

  const updateSub = (id, field, value) => setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  const addSub = () => setSubs((prev) => [...prev, { id: Date.now(), label: `Area ${prev.length + 1}`, length: 0, width: 0 }]);
  const removeSub = (id) => setSubs((prev) => prev.filter((s) => s.id !== id));

  return (
    <CalcShell title={title} subtitle={subtitle} icon={Icon}>
      <div className="space-y-4">
        {/* Sub-areas */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Areas</h2>
          <Button size="sm" onClick={addSub} className="bg-emerald-700"><Plus size={16} className="mr-1" /> Add Area</Button>
        </div>

        {subs.map((s) => (
          <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Input value={s.label} onChange={(e) => updateSub(s.id, "label", e.target.value)} className="h-9 flex-1" />
              <button onClick={() => removeSub(s.id)} className="p-2 text-red-500"><Trash2 size={18} /></button>
            </div>
            <MeasurementInput label="Length" onChange={(v) => updateSub(s.id, "length", v)} />
            <MeasurementInput label="Width" onChange={(v) => updateSub(s.id, "width", v)} />
            <div className="text-sm font-semibold text-emerald-700">Section area: {formatValue(s.length * s.width, precision)} sq ft</div>
          </div>
        ))}

        <div>
          <Label className="text-base font-semibold">Waste %</Label>
          <Select value={String(waste)} onValueChange={(v) => setWaste(Number(v))}>
            <SelectTrigger className="h-12 text-base mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[5, 7, 10, 12, 15].map((w) => (
                <SelectItem key={w} value={String(w)}>{w}%</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Checklist */}
        {checklist.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="font-bold text-slate-800 mb-3">Measurement Checklist</h2>
            <div className="space-y-2">
              {checklist.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setChecked((prev) => ({ ...prev, [i]: !prev[i] }))}
                  className="flex items-center gap-2 w-full text-left text-sm"
                >
                  {checked[i] ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Circle size={18} className="text-slate-300" />}
                  <span className={checked[i] ? "text-slate-400 line-through" : "text-slate-700"}>{item}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <WarningList warnings={warnings} />

        <div className="grid grid-cols-1 gap-3">
          <ResultCard title="Total Area" value={formatValue(totalArea, precision)} unit="sq ft"
            formula={subs.map((s) => `${formatValue(s.length * s.width, precision)}`).join(" + ") + ` = ${formatValue(totalArea, precision)}`} />
          <ResultCard title="Waste Amount" value={formatValue(wasteResult.wasteAmount, precision)} unit="sq ft" />
          <ResultCard title="Final Material (with waste)" value={formatValue(wasteResult.total, precision)} unit="sq ft"
            formula={`${formatValue(totalArea, precision)} + ${formatValue(wasteResult.wasteAmount, precision)} = ${formatValue(wasteResult.total, precision)}`} />
        </div>

        <FormulaBreakdown
          steps={[
            ...subs.map((s) => `${s.label}: ${formatValue(s.length, precision)} × ${formatValue(s.width, precision)} = ${formatValue(s.length * s.width, precision)} sq ft`),
            `Total = ${formatValue(totalArea, precision)} sq ft`,
            `Waste = ${formatValue(totalArea, precision)} × ${waste}% = ${formatValue(wasteResult.wasteAmount, precision)} sq ft`,
            `Final = ${formatValue(wasteResult.total, precision)} sq ft`,
          ]}
        />
      </div>
    </CalcShell>
  );
}
import React, { useState } from "react";
import { Crop, Plus, Trash2 } from "lucide-react";
import CalcShell from "@/components/CalcShell";
import { ResultCard, FormulaBreakdown, WarningList } from "@/components/ResultCard";
import { calcRectangle, calcTriangle, calcCircleFromRadius, calcTrapezoid, applyWaste, validateMeasurements, formatValue } from "@/lib/measurementUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SHAPE_TYPES = [
  { value: "rectangle", label: "Rectangle / Square" },
  { value: "triangle", label: "Triangle (base × height)" },
  { value: "trapezoid", label: "Trapezoid" },
  { value: "circle", label: "Circle" },
  { value: "semicircle", label: "Semicircle" },
];

let sectionCounter = 1;

function computeShape(shape, m) {
  switch (shape) {
    case "rectangle":
      return calcRectangle(parseFloat(m.a) || 0, parseFloat(m.b) || 0).area;
    case "triangle":
      return calcTriangle(parseFloat(m.a) || 0, parseFloat(m.b) || 0).area;
    case "trapezoid":
      return calcTrapezoid(parseFloat(m.a) || 0, parseFloat(m.b) || 0, parseFloat(m.c) || 0).area;
    case "circle":
      return calcCircleFromRadius(parseFloat(m.a) || 0).area;
    case "semicircle":
      return calcCircleFromRadius(parseFloat(m.a) || 0).area / 2;
    default:
      return 0;
  }
}

const SHAPE_LABELS = {
  rectangle: { a: "Length", b: "Width" },
  triangle: { a: "Base", b: "Height" },
  trapezoid: { a: "Side 1", b: "Side 2", c: "Height" },
  circle: { a: "Radius" },
  semicircle: { a: "Radius" },
};

export default function IrregularCalc() {
  const [sections, setSections] = useState([{ id: 0, label: "A", shape: "rectangle", a: "", b: "", c: "" }]);
  const [deductions, setDeductions] = useState([{ id: 0, label: "Existing concrete", area: "" }]);
  const [waste, setWaste] = useState(10);
  const [precision] = useState("hundredth");

  const grossArea = sections.reduce((sum, s) => sum + computeShape(s.shape, s), 0);
  const totalDeductions = deductions.reduce((sum, d) => sum + (parseFloat(d.area) || 0), 0);
  const netArea = Math.max(0, grossArea - totalDeductions);
  const wasteResult = applyWaste(netArea, waste);

  const warnings = validateMeasurements({ grossArea, deductions: totalDeductions, wastePercent: waste }, "irregular");

  const updateSection = (id, field, value) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };
  const addSection = () => {
    const letter = String.fromCharCode(65 + sections.length);
    setSections((prev) => [...prev, { id: Date.now(), label: letter, shape: "rectangle", a: "", b: "", c: "" }]);
  };
  const removeSection = (id) => setSections((prev) => prev.filter((s) => s.id !== id));

  const updateDeduction = (id, field, value) => {
    setDeductions((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  };
  const addDeduction = () => setDeductions((prev) => [...prev, { id: Date.now(), label: "New deduction", area: "" }]);
  const removeDeduction = (id) => setDeductions((prev) => prev.filter((d) => d.id !== id));

  return (
    <CalcShell title="Irregular Area" subtitle="Divide into shapes, subtract obstacles" icon={Crop}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800">Sections</h2>
          <Button size="sm" onClick={addSection} className="bg-emerald-700"><Plus size={16} className="mr-1" /> Add Section</Button>
        </div>

        {sections.map((s) => {
          const labels = SHAPE_LABELS[s.shape];
          return (
            <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-bold flex items-center justify-center">{s.label}</span>
                <Input value={s.label} onChange={(e) => updateSection(s.id, "label", e.target.value)} className="h-9 flex-1" />
                <button onClick={() => removeSection(s.id)} className="p-2 text-red-500"><Trash2 size={18} /></button>
              </div>
              <Select value={s.shape} onValueChange={(v) => updateSection(s.id, "shape", v)}>
                <SelectTrigger className="h-11 text-base"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SHAPE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">{labels.a}</Label>
                  <Input type="number" value={s.a} onChange={(e) => updateSection(s.id, "a", e.target.value)} className="h-11 text-base" />
                </div>
                {labels.b && (
                  <div>
                    <Label className="text-xs">{labels.b}</Label>
                    <Input type="number" value={s.b} onChange={(e) => updateSection(s.id, "b", e.target.value)} className="h-11 text-base" />
                  </div>
                )}
              </div>
              {labels.c && (
                <div>
                  <Label className="text-xs">{labels.c}</Label>
                  <Input type="number" value={s.c} onChange={(e) => updateSection(s.id, "c", e.target.value)} className="h-11 text-base" />
                </div>
              )}
              <div className="text-sm font-semibold text-emerald-700">Section area: {formatValue(computeShape(s.shape, s), precision)} sq ft</div>
            </div>
          );
        })}

        {/* Deductions */}
        <div className="flex items-center justify-between pt-2">
          <h2 className="font-bold text-slate-800">Deductions / Obstacles</h2>
          <Button size="sm" variant="outline" onClick={addDeduction}><Plus size={16} className="mr-1" /> Add</Button>
        </div>
        {deductions.map((d) => (
          <div key={d.id} className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-3">
            <Input value={d.label} onChange={(e) => updateDeduction(d.id, "label", e.target.value)} className="h-11 flex-1" />
            <Input type="number" placeholder="sq ft" value={d.area} onChange={(e) => updateDeduction(d.id, "area", e.target.value)} className="h-11 w-28 text-base" />
            <button onClick={() => removeDeduction(d.id)} className="p-2 text-red-500"><Trash2 size={18} /></button>
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

        <WarningList warnings={warnings} />

        <div className="grid grid-cols-1 gap-3">
          <ResultCard title="Gross Area" value={formatValue(grossArea, precision)} unit="sq ft" />
          <ResultCard title="Minus Deductions" value={formatValue(totalDeductions, precision)} unit="sq ft" />
          <ResultCard title="Net Project Area" value={formatValue(netArea, precision)} unit="sq ft"
            formula={`${formatValue(grossArea, precision)} − ${formatValue(totalDeductions, precision)} = ${formatValue(netArea, precision)}`} />
          <ResultCard title="Total with Waste" value={formatValue(wasteResult.total, precision)} unit="sq ft"
            formula={`${formatValue(netArea, precision)} + ${formatValue(wasteResult.wasteAmount, precision)} = ${formatValue(wasteResult.total, precision)}`} />
        </div>

        <FormulaBreakdown
          steps={[
            ...sections.map((s) => `Section ${s.label} (${s.shape}): ${formatValue(computeShape(s.shape, s), precision)} sq ft`),
            `Gross = sum of sections = ${formatValue(grossArea, precision)} sq ft`,
            `Deductions = ${formatValue(totalDeductions, precision)} sq ft`,
            `Net = ${formatValue(grossArea, precision)} − ${formatValue(totalDeductions, precision)} = ${formatValue(netArea, precision)} sq ft`,
            `With ${waste}% waste = ${formatValue(wasteResult.total, precision)} sq ft`,
          ]}
        />
      </div>
    </CalcShell>
  );
}
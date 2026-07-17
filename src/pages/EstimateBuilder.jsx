import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, Trash2, Save, LayoutGrid } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import {
  calcRectangle,
  calcCircleFromDiameter,
  calcTriangle,
  calcTrapezoid,
  formatValue,
  WASTE_OPTIONS,
} from "@/lib/measurementUtils";
import LayoutPlan from "@/components/LayoutPlan";

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

const SHAPES = [
  { value: "rectangle", label: "Rectangle / Square" },
  { value: "circle", "label": "Circle" },
  { value: "triangle", label: "Triangle (base / height)" },
  { value: "trapezoid", label: "Trapezoid" },
];

let uid = 0;
const newSection = (letter) => ({
  id: `s${++uid}`,
  label: letter,
  name: "",
  shape: "rectangle",
  measurements: { lengthFt: "", widthFt: "", diameter: "", baseFt: "", heightFt: "", sideA: "", sideB: "" },
});

function computeSection(section) {
  const m = section.measurements;
  const num = (v) => parseFloat(v) || 0;
  switch (section.shape) {
    case "rectangle": {
      const r = calcRectangle(num(m.lengthFt), num(m.widthFt));
      return { area: r.area, perimeter: r.perimeter };
    }
    case "circle": {
      const r = calcCircleFromDiameter(num(m.diameter));
      return { area: r.area, perimeter: r.circumference };
    }
    case "triangle":
      return { area: calcTriangle(num(m.baseFt), num(m.heightFt)).area, perimeter: 0 };
    case "trapezoid":
      return { area: calcTrapezoid(num(m.sideA), num(m.sideB), num(m.heightFt)).area, perimeter: 0 };
    default:
      return { area: 0, perimeter: 0 };
  }
}

export default function EstimateBuilder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sections, setSections] = useState([newSection("A"), newSection("B"), newSection("C")]);
  const [waste, setWaste] = useState(10);
  const [deduction, setDeduction] = useState(0);
  const [customDeduction, setCustomDeduction] = useState("");
  const [clientName, setClientName] = useState("");
  const [saving, setSaving] = useState(false);

  const computedMap = useMemo(() => {
    const map = {};
    sections.forEach((s) => {
      map[s.id] = computeSection(s);
    });
    return map;
  }, [sections]);

  const totalArea = sections.reduce((sum, s) => sum + (computedMap[s.id]?.area || 0), 0);
  const totalPerim = sections.reduce((sum, s) => sum + (computedMap[s.id]?.perimeter || 0), 0);
  const wasteArea = totalArea * (waste / 100);
  const totalWithWaste = totalArea + wasteArea;
  const deductionPercent = deduction === "custom" ? (parseFloat(customDeduction) || 0) : deduction;
  const deductionAmount = totalWithWaste * (deductionPercent / 100);
  const finalTotal = totalWithWaste - deductionAmount;

  const relabel = (list) => list.map((s, i) => ({ ...s, label: LETTERS[i] || `S${i + 1}` }));

  const addSection = () => {
    setSections((prev) => relabel([...prev, newSection(LETTERS[prev.length] || "S")]));
  };

  const removeSection = (id) => {
    setSections((prev) => relabel(prev.filter((s) => s.id !== id)));
  };

  const updateField = (id, field, value) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const updateMeasurement = (id, key, value) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, measurements: { ...s.measurements, [key]: value } } : s
      )
    );
  };

  const handleSave = async () => {
    if (!clientName.trim()) {
      toast({ title: "Enter a client name to save", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const project = await base44.entities.Project.create({ client_name: clientName });
      const sectionRecords = sections
        .filter((s) => computedMap[s.id]?.area > 0)
        .map((s, i) => ({
          project_id: project.id,
          label: s.label,
          section_name: s.name || `Section ${s.label}`,
          calculator_type: s.shape,
          measurements: s.measurements,
          results: computedMap[s.id],
          sort_order: i,
        }));
      if (sectionRecords.length) await base44.entities.Section.bulkCreate(sectionRecords);
      toast({ title: "Saved to project" });
      navigate(`/projects/${project.id}`);
    } catch (e) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="sticky top-0 z-20 bg-emerald-800 text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-lg hover:bg-emerald-700"><ChevronLeft size={24} /></button>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <LayoutGrid size={20} />
          <div>
            <h1 className="text-lg font-bold">Estimate Builder</h1>
            <p className="text-xs text-emerald-100">Add sections, enter measurements, get totals</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Save bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <div>
            <Label className="text-sm font-semibold">Client / Project Name</Label>
            <Input value={clientName} onChange={(e) => setClientName(e.target.value)} className="h-11 mt-1" placeholder="e.g. Johnson residence" />
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {sections.map((s) => {
            const c = computedMap[s.id];
            return (
              <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-9 h-9 rounded-lg bg-emerald-700 text-white font-bold flex items-center justify-center flex-shrink-0">{s.label}</span>
                  <Input
                    value={s.name}
                    onChange={(e) => updateField(s.id, "name", e.target.value)}
                    className="h-11 flex-1"
                    placeholder={`Section ${s.label} name (e.g. Driveway)`}
                  />
                  <button onClick={() => removeSection(s.id)} className="p-2 text-red-500"><Trash2 size={18} /></button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Shape</Label>
                    <Select value={s.shape} onValueChange={(v) => updateField(s.id, "shape", v)}>
                      <SelectTrigger className="h-11 mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SHAPES.map((sh) => (
                          <SelectItem key={sh.value} value={sh.value}>{sh.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <div className="bg-emerald-50 rounded-lg px-3 py-2 w-full text-sm">
                      <span className="text-slate-500">Area: </span>
                      <strong className="text-emerald-700">{formatValue(c?.area || 0, "hundredth")}</strong>
                      <span className="text-slate-400"> sf</span>
                      {c?.perimeter > 0 && (
                        <span className="text-slate-400"> · {formatValue(c.perimeter, "hundredth")} lf</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Measurement inputs per shape */}
                {s.shape === "rectangle" && (
                  <div className="grid grid-cols-2 gap-3">
                    <NumField label="Length (ft)" value={s.measurements.lengthFt} onChange={(v) => updateMeasurement(s.id, "lengthFt", v)} />
                    <NumField label="Width (ft)" value={s.measurements.widthFt} onChange={(v) => updateMeasurement(s.id, "widthFt", v)} />
                  </div>
                )}
                {s.shape === "circle" && (
                  <NumField label="Diameter (ft)" value={s.measurements.diameter} onChange={(v) => updateMeasurement(s.id, "diameter", v)} />
                )}
                {s.shape === "triangle" && (
                  <div className="grid grid-cols-2 gap-3">
                    <NumField label="Base (ft)" value={s.measurements.baseFt} onChange={(v) => updateMeasurement(s.id, "baseFt", v)} />
                    <NumField label="Height (ft)" value={s.measurements.heightFt} onChange={(v) => updateMeasurement(s.id, "heightFt", v)} />
                  </div>
                )}
                {s.shape === "trapezoid" && (
                  <div className="grid grid-cols-3 gap-3">
                    <NumField label="Side A (ft)" value={s.measurements.sideA} onChange={(v) => updateMeasurement(s.id, "sideA", v)} />
                    <NumField label="Side B (ft)" value={s.measurements.sideB} onChange={(v) => updateMeasurement(s.id, "sideB", v)} />
                    <NumField label="Height (ft)" value={s.measurements.heightFt} onChange={(v) => updateMeasurement(s.id, "heightFt", v)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Button onClick={addSection} variant="outline" className="w-full h-12 border-emerald-300 text-emerald-700 border-dashed">
          <Plus size={18} className="mr-2" /> Add Section {LETTERS[sections.length] || ""}
        </Button>

        {/* Layout plan */}
        <LayoutPlan sections={sections} computedMap={computedMap} />

        {/* Totals */}
        <div className="bg-emerald-800 text-white rounded-2xl p-5 shadow-lg space-y-4">
          <h2 className="font-bold text-lg">Project Totals</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-700 rounded-xl p-3 text-center">
              <div className="text-2xl font-extrabold">{formatValue(totalArea, "hundredth")}</div>
              <div className="text-xs text-emerald-100">Total Sq Ft</div>
            </div>
            <div className="bg-emerald-700 rounded-xl p-3 text-center">
              <div className="text-2xl font-extrabold">{formatValue(totalPerim, "hundredth")}</div>
              <div className="text-xs text-emerald-100">Perimeter (lf)</div>
            </div>
          </div>
          <div>
            <Label className="text-emerald-100 text-sm">Waste % (adds)</Label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {WASTE_OPTIONS.map((w) => (
                <button
                  key={w.value}
                  onClick={() => setWaste(w.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                    waste === w.value ? "bg-amber-400 text-emerald-900" : "bg-emerald-700 text-white"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-emerald-100 text-sm">Remove % (deduction)</Label>
            <div className="flex gap-2 mt-1 flex-wrap items-center">
              {[0, 5, 10, 15, 20].map((d) => (
                <button
                  key={d}
                  onClick={() => { setDeduction(d); setCustomDeduction(""); }}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                    deduction === d ? "bg-rose-400 text-white" : "bg-emerald-700 text-white"
                  }`}
                >
                  {d === 0 ? "None" : `${d}%`}
                </button>
              ))}
              <button
                onClick={() => setDeduction("custom")}
                className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                  deduction === "custom" ? "bg-rose-400 text-white" : "bg-emerald-700 text-white"
                }`}
              >
                Custom
              </button>
              {deduction === "custom" && (
                <Input
                  type="number"
                  inputMode="decimal"
                  value={customDeduction}
                  onChange={(e) => setCustomDeduction(e.target.value)}
                  className="h-9 w-24 bg-white text-emerald-900"
                  placeholder="%"
                />
              )}
            </div>
          </div>
          {deductionPercent > 0 && (
            <div className="bg-rose-500/90 text-white rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold">Less {deductionPercent}% deduction</div>
                <div className="text-xs text-rose-100">− {formatValue(deductionAmount, "hundredth")} sf</div>
              </div>
              <div className="text-lg font-extrabold">{formatValue(totalWithWaste, "hundredth")} sf</div>
            </div>
          )}
          <div className="bg-amber-400 text-emerald-900 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold">Final total</div>
              <div className="text-xs text-emerald-800">
                {formatValue(totalArea, "hundredth")} sf + {formatValue(wasteArea, "hundredth")} waste
                {deductionPercent > 0 && ` − ${formatValue(deductionAmount, "hundredth")} ded`}
              </div>
            </div>
            <div className="text-2xl font-extrabold">{formatValue(finalTotal, "hundredth")} sf</div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full h-12 bg-emerald-700">
          <Save size={18} className="mr-2" /> {saving ? "Saving..." : "Save as Project"}
        </Button>
      </div>
    </div>
  );
}

function NumField({ label, value, onChange }) {
  return (
    <div>
      <Label className="text-xs font-semibold">{label}</Label>
      <Input
        type="number"
        inputMode="decimal"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 mt-1 text-base"
        placeholder="0"
      />
    </div>
  );
}
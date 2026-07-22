import React, { useState } from "react";
import { Box, Plus, Trash2 } from "lucide-react";
import CalcShell from "@/components/CalcShell";
import MeasurementInput from "@/components/MeasurementInput";
import { ResultCard, FormulaBreakdown, WarningList } from "@/components/ResultCard";
import { applyWaste, formatValue } from "@/lib/measurementUtils";
import QuickMeasureBar from "@/components/quickmeasure/QuickMeasureBar";
import AdvancedDetails from "@/components/quickmeasure/AdvancedDetails";
import SaveToProject from "@/components/SaveToProject";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const WALL_TYPES = [
  { value: "retaining", label: "Retaining Wall" },
  { value: "seat", label: "Seat / Bench Wall" },
  { value: "planter", label: "Planter" },
  { value: "steps", label: "Step / Entry Wall" },
];

let _id = 0;
const uid = () => `${Date.now()}-${_id++}`;

export default function WallsCalc() {
  const [wallType, setWallType] = useState("retaining");
  const [segs, setSegs] = useState([{ id: uid(), label: "Segment 1", length: 0, height: 0 }]);
  const [hasCap, setHasCap] = useState(true);
  const [exposedEnds, setExposedEnds] = useState(2);
  const [waste, setWaste] = useState(10);
  const [precision] = useState("hundredth");

  const totalLength = segs.reduce((s, x) => s + (parseFloat(x.length) || 0), 0);
  const avgHeight = segs.length
    ? segs.reduce((s, x) => s + (parseFloat(x.height) || 0), 0) / segs.length
    : 0;
  const faceArea = segs.reduce((s, x) => s + (parseFloat(x.length) || 0) * (parseFloat(x.height) || 0), 0);
  const capLinear = hasCap ? totalLength : 0;
  const endLinear = Math.max(0, exposedEnds) * avgHeight;
  const wasteResult = applyWaste(faceArea, waste);

  const warnings = [];
  if (totalLength <= 0) warnings.push("Enter a wall length.");
  if (avgHeight <= 0) warnings.push("Enter a wall height.");

  const updateSeg = (id, field, value) => setSegs((p) => p.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  const addSeg = () => setSegs((p) => [...p, { id: uid(), label: `Segment ${p.length + 1}`, length: 0, height: 0 }]);
  const removeSeg = (id) => setSegs((p) => p.filter((s) => s.id !== id));

  const saveSections = [
    {
      label: `Walls (${wallType})`,
      type: "rectangle",
      params: { length: totalLength, width: avgHeight },
      deductions: [],
      gross: faceArea,
      totalDeduct: 0,
      net: faceArea,
    },
  ];

  return (
    <CalcShell title="Walls & Planters" subtitle="Face area, caps, ends & corners" icon={Box}>
      <div className="space-y-4">
        <QuickMeasureBar helpId="walls" guidedId="walls" />

        <div>
          <Label className="text-base font-semibold">Wall Type</Label>
          <Select value={wallType} onValueChange={setWallType}>
            <SelectTrigger className="h-12 text-base mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {WALL_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-slate-800">Add Cap Course</div>
            <div className="text-xs text-slate-500">Top row of cap pieces along the wall length.</div>
          </div>
          <Switch checked={hasCap} onCheckedChange={setHasCap} />
        </div>

        {segs.map((s) => (
          <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Input value={s.label} onChange={(e) => updateSeg(s.id, "label", e.target.value)} className="h-9 flex-1" />
              {segs.length > 1 && (
                <button onClick={() => removeSeg(s.id)} className="p-2 text-rose-600"><Trash2 size={18} /></button>
              )}
            </div>
            <MeasurementInput label="Length" onChange={(v) => updateSeg(s.id, "length", v)} />
            <MeasurementInput label="Height" onChange={(v) => updateSeg(s.id, "height", v)} />
            <div className="text-sm font-semibold text-emerald-700">
              Face area: {formatValue((parseFloat(s.length) || 0) * (parseFloat(s.height) || 0), precision)} sq ft
            </div>
          </div>
        ))}

        <button onClick={addSeg} className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 text-slate-600 rounded-xl py-3 font-bold active:scale-95">
          <Plus size={18} /> Add Segment (L, U or custom)
        </button>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-base font-semibold">Exposed Ends</Label>
            <Input type="number" value={exposedEnds} onChange={(e) => setExposedEnds(Number(e.target.value))} className="h-14 text-lg mt-1" />
          </div>
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
        </div>

        <WarningList warnings={warnings} />

        <div className="grid grid-cols-1 gap-3">
          <ResultCard title="Total Wall Length" value={formatValue(totalLength, precision)} unit="lin ft"
            formula={segs.map((s) => formatValue(parseFloat(s.length) || 0, precision)).join(" + ") + ` = ${formatValue(totalLength, precision)}`} />
          <ResultCard title="Average Height" value={formatValue(avgHeight, precision)} unit="ft" />
          <ResultCard title="Face Area" value={formatValue(faceArea, precision)} unit="sq ft"
            formula={`${formatValue(totalLength, precision)} × ${formatValue(avgHeight, precision)} = ${formatValue(faceArea, precision)}`} />
          {hasCap && (
            <ResultCard title="Cap Linear Footage" value={formatValue(capLinear, precision)} unit="lin ft"
              formula={`Cap along ${formatValue(totalLength, precision)} ft`} />
          )}
          {exposedEnds > 0 && (
            <ResultCard title="Exposed End Footage" value={formatValue(endLinear, precision)} unit="lin ft"
              formula={`${exposedEnds} ends × ${formatValue(avgHeight, precision)} ft`} />
          )}
          <ResultCard title="Final Material (with waste)" value={formatValue(wasteResult.total, precision)} unit="sq ft"
            formula={`${formatValue(faceArea, precision)} + ${formatValue(wasteResult.wasteAmount, precision)} = ${formatValue(wasteResult.total, precision)}`} />
        </div>

        <AdvancedDetails title="Formula Breakdown" summary="Step-by-step calculation detail">
          <FormulaBreakdown
            steps={[
              `Segments: ${segs.length}`,
              `Total length = ${formatValue(totalLength, precision)} ft`,
              `Average height = ${formatValue(avgHeight, precision)} ft`,
              `Face area = ${formatValue(totalLength, precision)} × ${formatValue(avgHeight, precision)} = ${formatValue(faceArea, precision)} sq ft`,
              `Waste = ${formatValue(faceArea, precision)} × ${waste}% = ${formatValue(wasteResult.wasteAmount, precision)} sq ft`,
              `Final = ${formatValue(faceArea, precision)} + ${formatValue(wasteResult.wasteAmount, precision)} = ${formatValue(wasteResult.total, precision)} sq ft`,
              hasCap ? `Cap linear = ${formatValue(capLinear, precision)} lin ft` : "",
              exposedEnds > 0 ? `End linear = ${exposedEnds} × ${formatValue(avgHeight, precision)} = ${formatValue(endLinear, precision)} lin ft` : "",
            ].filter(Boolean)}
          />
        </AdvancedDetails>

        <SaveToProject sections={saveSections} />
      </div>
    </CalcShell>
  );
}
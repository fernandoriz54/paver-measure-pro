import React, { useState, useMemo } from "react";
import { DoorOpen, Plus, RotateCcw } from "lucide-react";
import CalcShell from "@/components/CalcShell";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StepRow from "@/components/entrance/StepRow";
import EntranceSummary from "@/components/entrance/EntranceSummary";
import EntranceReport from "@/components/entrance/EntranceReport";
import { computeEntrance, newStep, COVERAGE_MODES, BORDER_MODES } from "@/lib/entranceUtils";
import { formatValue } from "@/lib/measurementUtils";

const today = new Date().toISOString().slice(0, 10);

const exampleProject = () => ({
  clientName: "Sample Residence",
  projectAddress: "123 Garden Lane",
  measuredDate: today,
  consultantName: "Field Consultant",
  numSections: 1,
  walkway: { length: 18, width: 4 },
  porch: { length: 0, width: 0 },
  landing: { length: 6, width: 4 },
  stepsEqual: false,
  steps: [
    { id: 1, width: 8, treadDepthIn: 14, riserHeightIn: 6, frontEdge: true, leftReturn: 0, rightReturn: 0, includeLeftSide: false, includeRightSide: false, notes: "Bottom step" },
    { id: 2, width: 6, treadDepthIn: 14, riserHeightIn: 6, frontEdge: true, leftReturn: 0, rightReturn: 0, includeLeftSide: false, includeRightSide: false, notes: "Middle step" },
    { id: 3, width: 4, treadDepthIn: 14, riserHeightIn: 6, frontEdge: true, leftReturn: 0, rightReturn: 0, includeLeftSide: false, includeRightSide: false, notes: "Top step" },
  ],
  coverageMode: "tread+riser",
  bullnoseLanding: { front: 0, left: 0, right: 0, back: 0 },
  bullnosePorch: { front: 0, left: 0, right: 0, back: 0 },
  bullnoseExtra: 0,
  border: { widthIn: 6, mode: "outside", linearFeetWalkway: 0, linearFeetPorch: 0, linearFeetLanding: 0, linearFeetSteps: 0, linearFeetPerimeter: 0 },
  bullnoseProduct: { lengthIn: 12, widthIn: 6, piecesPerPallet: 0, linearFeetPerPallet: 0, wastePct: 10 },
  paverProduct: { sizeLabel: "6 × 9", lengthIn: 9, widthIn: 6, sqftPerPallet: 0, piecesPerPallet: 0 },
  wastePct: 10,
  deductions: [],
  existingConcrete: { length: 0, width: 0 },
  riseRun: { totalHeightIn: 18, numRisers: 3, riserHeights: [], treadDepths: [], landingDepthFt: 0, includeLandingInRun: false },
  photos: [],
  notes: "",
});

const blankProject = () => ({ ...exampleProject(), clientName: "", projectAddress: "", walkway: { length: 0, width: 0 }, porch: { length: 0, width: 0 }, landing: { length: 0, width: 0 }, steps: [newStep(0)], stepsEqual: false, bullnoseExtra: 0, notes: "" });

const Card = ({ title, children, action }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-bold uppercase tracking-wide text-emerald-700">{title}</h2>
      {action}
    </div>
    {children}
  </div>
);

const Field = ({ label, value, onChange, type = "number", placeholder }) => (
  <div>
    <Label className="text-xs text-slate-500">{label}</Label>
    <Input type={type} inputMode="decimal" value={value} placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)} className="h-11 text-base" />
  </div>
);

export default function EntranceCalc() {
  const [p, setP] = useState(exampleProject);
  const set = (k, v) => setP((s) => ({ ...s, [k]: v }));
  const setGroup = (g, k, v) => setP((s) => ({ ...s, [g]: { ...s[g], [k]: v } }));
  const r = useMemo(() => computeEntrance(p), [p]);

  const updateStep = (id, k, v) => setP((s) => ({
    ...s,
    steps: s.steps.map((st) => (st.id === id ? { ...st, [k]: v } : st)),
  }));
  const addStep = () => set("steps", [...p.steps, newStep(p.steps.length)]);
  const removeStep = (id) => set("steps", p.steps.filter((s) => s.id !== id));

  const makeStepsEqual = () => {
    if (p.steps.length === 0) return;
    const first = p.steps[0];
    set("steps", p.steps.map((s) => ({ ...s, width: first.width, treadDepthIn: first.treadDepthIn, riserHeightIn: first.riserHeightIn })));
    set("stepsEqual", true);
  };

  const addDeduction = () => set("deductions", [...p.deductions, { label: "New deduction", area: 0 }]);
  const updateDeduction = (i, k, v) => set("deductions", p.deductions.map((d, idx) => (idx === i ? { ...d, [k]: v } : d)));
  const removeDeduction = (i) => set("deductions", p.deductions.filter((_, idx) => idx !== i));

  return (
    <CalcShell title="Home Entrance Calculator" subtitle="Walkway, porch, landing, steps & bullnose" icon={DoorOpen}>
      <div className="space-y-4">
        <div className="flex gap-2 no-print">
          <Button variant="outline" size="sm" onClick={() => setP(exampleProject())}>
            <RotateCcw size={14} className="mr-1" /> Load Example
          </Button>
          <Button variant="outline" size="sm" onClick={() => setP(blankProject())}>
            <Plus size={14} className="mr-1" /> Start Blank
          </Button>
        </div>

        <Card title="Project Info">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Client name" value={p.clientName} onChange={(v) => set("clientName", v)} type="text" />
            <Field label="Project address" value={p.projectAddress} onChange={(v) => set("projectAddress", v)} type="text" />
            <Field label="Date measured" value={p.measuredDate} onChange={(v) => set("measuredDate", v)} type="date" />
            <Field label="Consultant name" value={p.consultantName} onChange={(v) => set("consultantName", v)} type="text" />
            <Field label="Number of entrance sections" value={p.numSections} onChange={(v) => set("numSections", v)} />
          </div>
        </Card>

        <Card title="Walkway / Porch / Landing">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Walkway length (ft)" value={p.walkway.length} onChange={(v) => setGroup("walkway", "length", v)} />
            <Field label="Walkway width (ft)" value={p.walkway.width} onChange={(v) => setGroup("walkway", "width", v)} />
            <Field label="Porch length (ft)" value={p.porch.length} onChange={(v) => setGroup("porch", "length", v)} />
            <Field label="Porch width (ft)" value={p.porch.width} onChange={(v) => setGroup("porch", "width", v)} />
            <Field label="Landing length (ft)" value={p.landing.length} onChange={(v) => setGroup("landing", "length", v)} />
            <Field label="Landing width (ft)" value={p.landing.width} onChange={(v) => setGroup("landing", "width", v)} />
          </div>
        </Card>

        <Card title={`Steps (${p.steps.length})`} action={
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={makeStepsEqual}>All steps equal</Button>
            <Button size="sm" variant="outline" onClick={addStep}><Plus size={14} className="mr-1" /> Add step</Button>
          </div>
        }>
          <p className="text-xs text-slate-500">Each step has its own measurements — widths are never multiplied by count.</p>
          <div className="space-y-3">
            {p.steps.map((s, i) => (
              <StepRow key={s.id} step={s} index={i}
                onChange={(k, v) => updateStep(s.id, k, v)}
                onRemove={() => removeStep(s.id)} />
            ))}
          </div>
          <div>
            <Label className="text-xs text-slate-500">Step coverage</Label>
            <Select value={p.coverageMode} onValueChange={(v) => set("coverageMode", v)}>
              <SelectTrigger className="h-11 text-base mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COVERAGE_MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card title="Bullnose Edging & Returns">
          <p className="text-xs text-slate-500">Step front edges + returns are summed per step in the report. Add landing, porch, curved & additional edges below.</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Landing front (ft)" value={p.bullnoseLanding.front} onChange={(v) => setGroup("bullnoseLanding", "front", v)} />
            <Field label="Landing left side (ft)" value={p.bullnoseLanding.left} onChange={(v) => setGroup("bullnoseLanding", "left", v)} />
            <Field label="Landing right side (ft)" value={p.bullnoseLanding.right} onChange={(v) => setGroup("bullnoseLanding", "right", v)} />
            <Field label="Landing back (ft)" value={p.bullnoseLanding.back} onChange={(v) => setGroup("bullnoseLanding", "back", v)} />
            <Field label="Porch front (ft)" value={p.bullnosePorch.front} onChange={(v) => setGroup("bullnosePorch", "front", v)} />
            <Field label="Porch left (ft)" value={p.bullnosePorch.left} onChange={(v) => setGroup("bullnosePorch", "left", v)} />
            <Field label="Porch right (ft)" value={p.bullnosePorch.right} onChange={(v) => setGroup("bullnosePorch", "right", v)} />
            <Field label="Porch back (ft)" value={p.bullnosePorch.back} onChange={(v) => setGroup("bullnosePorch", "back", v)} />
            <Field label="Curved / additional edges (ft)" value={p.bullnoseExtra} onChange={(v) => set("bullnoseExtra", v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bullnose piece length (in)" value={p.bullnoseProduct.lengthIn} onChange={(v) => setGroup("bullnoseProduct", "lengthIn", v)} />
            <Field label="Bullnose piece width (in)" value={p.bullnoseProduct.widthIn} onChange={(v) => setGroup("bullnoseProduct", "widthIn", v)} />
            <Field label="Pieces per pallet" value={p.bullnoseProduct.piecesPerPallet} onChange={(v) => setGroup("bullnoseProduct", "piecesPerPallet", v)} />
            <Field label="Bullnose waste %" value={p.bullnoseProduct.wastePct} onChange={(v) => setGroup("bullnoseProduct", "wastePct", v)} />
          </div>
        </Card>

        <Card title="Border">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Border width (in)" value={p.border.widthIn} onChange={(v) => setGroup("border", "widthIn", v)} />
            <div>
              <Label className="text-xs text-slate-500">Border placement</Label>
              <Select value={p.border.mode} onValueChange={(v) => setGroup("border", "mode", v)}>
                <SelectTrigger className="h-11 text-base mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BORDER_MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Field label="Walkway border linear (ft)" value={p.border.linearFeetWalkway} onChange={(v) => setGroup("border", "linearFeetWalkway", v)} />
            <Field label="Porch border linear (ft)" value={p.border.linearFeetPorch} onChange={(v) => setGroup("border", "linearFeetPorch", v)} />
            <Field label="Landing border linear (ft)" value={p.border.linearFeetLanding} onChange={(v) => setGroup("border", "linearFeetLanding", v)} />
            <Field label="Steps border linear (ft)" value={p.border.linearFeetSteps} onChange={(v) => setGroup("border", "linearFeetSteps", v)} />
            <Field label="Perimeter border linear (ft)" value={p.border.linearFeetPerimeter} onChange={(v) => setGroup("border", "linearFeetPerimeter", v)} />
          </div>
        </Card>

        <Card title="Rise & Run">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total vertical height (in)" value={p.riseRun.totalHeightIn} onChange={(v) => setGroup("riseRun", "totalHeightIn", v)} />
            <Field label="Number of risers" value={p.riseRun.numRisers} onChange={(v) => setGroup("riseRun", "numRisers", v)} />
            <Field label="Landing depth (ft)" value={p.riseRun.landingDepthFt} onChange={(v) => setGroup("riseRun", "landingDepthFt", v)} />
          </div>
          <div className="text-xs space-y-1 text-slate-600 bg-slate-50 rounded-md p-2">
            <div>Total rise: <b>{formatValue(r.totalRise, "hundredth")} ft</b></div>
            <div>Average riser: <b>{formatValue(r.avgRiser, "hundredth")} ft</b></div>
            <div>Total run: <b>{formatValue(r.totalRun, "hundredth")} ft</b></div>
            <div>Overall footprint: <b>{formatValue(r.footprint, "hundredth")} ft</b></div>
            {r.inconsistentRisers && <div className="text-amber-700 font-semibold">⚠ Riser heights inconsistent.</div>}
          </div>
        </Card>

        <Card title="Deductions & Existing Concrete">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Existing concrete length (ft)" value={p.existingConcrete.length} onChange={(v) => setGroup("existingConcrete", "length", v)} />
            <Field label="Existing concrete width (ft)" value={p.existingConcrete.width} onChange={(v) => setGroup("existingConcrete", "width", v)} />
          </div>
          <div className="space-y-2">
            {p.deductions.map((d, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input value={d.label} onChange={(e) => updateDeduction(i, "label", e.target.value)} className="h-10 text-sm flex-1" />
                <Input type="number" inputMode="decimal" value={d.area} onChange={(e) => updateDeduction(i, "area", e.target.value)} className="h-10 text-sm w-28" />
                <button onClick={() => removeDeduction(i)} className="p-1.5 text-red-500"><Plus size={16} className="rotate-45" /></button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={addDeduction}><Plus size={14} className="mr-1" /> Add deduction</Button>
          </div>
        </Card>

        <Card title="Paver Product & Waste">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Paver product size" value={p.paverProduct.sizeLabel} onChange={(v) => setGroup("paverProduct", "sizeLabel", v)} type="text" />
            <Field label="Paver length (in)" value={p.paverProduct.lengthIn} onChange={(v) => setGroup("paverProduct", "lengthIn", v)} />
            <Field label="Paver width (in)" value={p.paverProduct.widthIn} onChange={(v) => setGroup("paverProduct", "widthIn", v)} />
            <Field label="Sq ft per pallet" value={p.paverProduct.sqftPerPallet} onChange={(v) => setGroup("paverProduct", "sqftPerPallet", v)} />
            <Field label="Waste %" value={p.wastePct} onChange={(v) => set("wastePct", v)} />
          </div>
        </Card>

        <Card title="Photos">
          <input type="file" multiple accept="image/*" onChange={(e) => set("photos", Array.from(e.target.files).map((f) => f.name))} className="text-xs" />
          <p className="text-xs text-slate-500">{(p.photos || []).length} photo(s) attached.</p>
        </Card>

        <Card title="Notes">
          <Textarea value={p.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Notes and installation concerns" className="text-sm" />
        </Card>

        <EntranceSummary r={r} wastePct={p.wastePct} />
        <EntranceReport p={p} r={r} />
      </div>
    </CalcShell>
  );
}
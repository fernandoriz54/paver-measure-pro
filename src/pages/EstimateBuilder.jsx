import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Plus, Trash2, Save, LayoutGrid, RotateCcw, RotateCw } from "lucide-react";
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
import ObstacleToolkit from "@/components/ObstacleToolkit";
import { activeDeductionArea } from "@/lib/deductionUtils";
import { buildSnapshot, hydrate, saveRecovery, loadRecovery, clearRecovery } from "@/lib/builderPersistence";

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

const SHAPES = [
  { value: "rectangle", label: "Rectangle / Square" },
  { value: "circle", label: "Circle" },
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
  rotation: 0,
  notes: "",
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
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [sections, setSections] = useState([newSection("A"), newSection("B"), newSection("C")]);
  const [waste, setWaste] = useState(10);
  const [deductions, setDeductions] = useState([]);
  const [clientName, setClientName] = useState("");
  const [notes, setNotes] = useState("");
  const [visualizer, setVisualizer] = useState({});
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | unsaved | saving | saved | error
  const [linkedProjectId, setLinkedProjectId] = useState(null);
  const [showNameError, setShowNameError] = useState(false);
  const [recoverOffer, setRecoverOffer] = useState(null); // {snapshot, ts, projectId}
  const [loading, setLoading] = useState(false);

  const loadedRef = useRef(false);
  const suppressAutoSave = useRef(false);

  // ---- Load an existing project into the Builder (restore) ----
  useEffect(() => {
    const projectId = searchParams.get("projectId");
    if (!projectId) { loadedRef.current = true; return; }
    setLoading(true);
    (async () => {
      try {
        const project = await base44.entities.Project.get(projectId);
        setLinkedProjectId(project.id);
        if (project.builder_state && Object.keys(project.builder_state).length) {
          const h = hydrate(project.builder_state);
          setClientName(h.clientName);
          setNotes(h.notes || "");
          setWaste(h.waste ?? 0);
          setSections(h.sections.length ? h.sections : [newSection("A")]);
          setDeductions(h.deductions);
          setVisualizer(h.visualizer || {});
        } else {
          // Old/summary-only project — keep client name, offer local recovery if any.
          setClientName(project.client_name || "");
          const rec = loadRecovery(project.id);
          if (rec) setRecoverOffer({ ...rec, projectId: project.id });
        }
      } catch (e) {
        toast({ title: "Failed to load project", description: e.message, variant: "destructive" });
      } finally {
        setLoading(false);
        // allow the next tick's state settle before enabling dirty/auto-save
        setTimeout(() => { loadedRef.current = true; }, 0);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const computedMap = useMemo(() => {
    const map = {};
    sections.forEach((s) => { map[s.id] = computeSection(s); });
    return map;
  }, [sections]);

  const totalArea = sections.reduce((sum, s) => sum + (computedMap[s.id]?.area || 0), 0);
  const totalPerim = sections.reduce((sum, s) => sum + (computedMap[s.id]?.perimeter || 0), 0);
  const wasteArea = totalArea * (waste / 100);
  const totalWithWaste = totalArea + wasteArea;
  const deductionAmount = activeDeductionArea(deductions);
  const finalTotal = totalWithWaste - deductionAmount;

  const vizSections = sections.map((s) => {
    const m = s.measurements;
    const base = { id: String(s.id), label: s.label, name: s.name };
    switch (s.shape) {
      case "rectangle": return { ...base, type: "rectangle", params: { length: parseFloat(m.lengthFt) || 0, width: parseFloat(m.widthFt) || 0 } };
      case "circle": return { ...base, type: "circle", params: { radius: (parseFloat(m.diameter) || 0) / 2 } };
      case "triangle": return { ...base, type: "triangle", params: { base: parseFloat(m.baseFt) || 0, height: parseFloat(m.heightFt) || 0 } };
      case "trapezoid": return { ...base, type: "trapezoid", params: { a: parseFloat(m.sideA) || 0, b: parseFloat(m.sideB) || 0, height: parseFloat(m.heightFt) || 0 } };
      default: return { ...base, type: "rectangle", params: { length: 0, width: 0 } };
    }
  });

  const relabel = (list) => list.map((s, i) => ({ ...s, label: LETTERS[i] || `S${i + 1}` }));

  const addSection = () => {
    setSections((prev) => relabel([...prev, newSection(LETTERS[prev.length] || "S")]));
  };
  const removeSection = (id) => setSections((prev) => relabel(prev.filter((s) => s.id !== id)));
  const updateField = (id, field, value) => setSections((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  const updateMeasurement = (id, key, value) =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, measurements: { ...s.measurements, [key]: value } } : s)));
  const rotateSection = (id, delta) =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, rotation: ((s.rotation || 0) + delta + 360) % 360 } : s)));
  const setSectionRotation = (id, deg) =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, rotation: Math.max(0, Math.min(359, parseInt(deg) || 0)) } : s)));

  const totals = { grossArea: totalArea, deductionArea: deductionAmount, netArea: totalArea - deductionAmount, perimeter: totalPerim, finalTotal };

  // ---- Debounced auto-save to the linked project + local recovery ----
  useEffect(() => {
    if (!loadedRef.current) return;
    if (!linkedProjectId) { setStatus(sections.length || deductions.length || clientName ? "unsaved" : "idle"); return; }
    if (suppressAutoSave.current) { suppressAutoSave.current = false; return; }
    setStatus("unsaved");
    const t = setTimeout(async () => {
      setStatus("saving");
      try {
        const snapshot = buildSnapshot({ clientName, sections, deductions, visualizer, waste, notes, totals });
        await base44.entities.Project.update(linkedProjectId, {
          client_name: clientName,
          builder_state: snapshot,
          last_saved_date: new Date().toISOString(),
        });
        saveRecovery(linkedProjectId, snapshot);
        setStatus("saved");
      } catch (e) {
        // keep a local copy even if the DB write fails
        saveRecovery(linkedProjectId, buildSnapshot({ clientName, sections, deductions, visualizer, waste, notes, totals }));
        setStatus("error");
      }
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, deductions, visualizer, waste, notes, clientName, linkedProjectId]);

  const handleSave = async () => {
    if (!clientName.trim()) { setShowNameError(true); return; }
    setSaving(true);
    setShowNameError(false);
    try {
      const snapshot = buildSnapshot({ clientName, sections, deductions, visualizer, waste, notes, totals });
      if (linkedProjectId) {
        await base44.entities.Project.update(linkedProjectId, {
          client_name: clientName,
          builder_state: snapshot,
          last_saved_date: new Date().toISOString(),
        });
        saveRecovery(linkedProjectId, snapshot);
        suppressAutoSave.current = true;
        setStatus("saved");
        toast({ title: "Changes saved" });
      } else {
        const project = await base44.entities.Project.create({
          client_name: clientName,
          builder_state: snapshot,
          builder_version: 1,
          last_saved_date: new Date().toISOString(),
        });
        saveRecovery(project.id, snapshot);
        setLinkedProjectId(project.id);
        setSearchParams({ projectId: project.id }, { replace: true });
        suppressAutoSave.current = true;
        setStatus("saved");
        toast({ title: "Project saved" });
      }
    } catch (e) {
      // local recovery copy survives a DB failure
      saveRecovery(linkedProjectId || "unsaved", buildSnapshot({ clientName, sections, deductions, visualizer, waste, notes, totals }));
      setStatus("error");
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const acceptRecovery = () => {
    if (!recoverOffer) return;
    const h = hydrate(recoverOffer.snapshot);
    if (h) {
      setClientName(h.clientName);
      setNotes(h.notes || "");
      setWaste(h.waste ?? 0);
      setSections(h.sections.length ? h.sections : [newSection("A")]);
      setDeductions(h.deductions);
      setVisualizer(h.visualizer || {});
      toast({ title: "Recovered Builder data loaded" });
    }
    setRecoverOffer(null);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading project…</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="sticky top-0 z-20 bg-emerald-800 text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-lg hover:bg-emerald-700"><ChevronLeft size={24} /></button>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <LayoutGrid size={20} />
          <div>
            <h1 className="text-lg font-bold">Estimate Builder</h1>
            <p className="text-xs text-emerald-100">{linkedProjectId ? "Editing saved project" : "Add sections, enter measurements, get totals"}</p>
          </div>
        </div>
        <SaveStatus status={status} linked={!!linkedProjectId} />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Save bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          <div>
            <Label className="text-sm font-semibold">Client / Project Name</Label>
            <Input
              value={clientName}
              onChange={(e) => { setClientName(e.target.value); setShowNameError(false); }}
              className={`h-11 mt-1 ${showNameError ? "border-red-500" : ""}`}
              placeholder="e.g. Johnson residence"
            />
            {showNameError && <p className="text-xs text-red-600 mt-1 font-semibold">Enter a client / project name to save.</p>}
          </div>
        </div>

        {recoverOffer && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-sm text-amber-800 flex items-center justify-between gap-2">
            <div>
              <div className="font-semibold">Recover unsaved Builder data?</div>
              <div className="text-xs">A local copy from {new Date(recoverOffer.ts).toLocaleString()} has measurements this summary-only project doesn't store.</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={acceptRecovery} className="bg-amber-600">Recover</Button>
              <Button size="sm" variant="outline" onClick={() => { clearRecovery(recoverOffer.projectId); setRecoverOffer(null); }}>Discard</Button>
            </div>
          </div>
        )}

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
                        {SHAPES.map((sh) => (<SelectItem key={sh.value} value={sh.value}>{sh.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <div className="bg-emerald-50 rounded-lg px-3 py-2 w-full text-sm">
                      <span className="text-slate-500">Area: </span>
                      <strong className="text-emerald-700">{formatValue(c?.area || 0, "hundredth")}</strong>
                      <span className="text-slate-400"> sf</span>
                      {c?.perimeter > 0 && (<span className="text-slate-400"> · {formatValue(c.perimeter, "hundredth")} lf</span>)}
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

                {/* Rotation (visual only — does not change area/perimeter) */}
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-2.5 py-1.5">
                  <span className="text-xs font-semibold text-slate-500">Rotation</span>
                  <button onClick={() => rotateSection(s.id, -15)} className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600"><RotateCcw size={14} /></button>
                  <button onClick={() => rotateSection(s.id, 15)} className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600"><RotateCw size={14} /></button>
                  <Input
                    type="number"
                    min="0" max="359"
                    value={s.rotation || 0}
                    onChange={(e) => setSectionRotation(s.id, e.target.value)}
                    className="h-8 w-16 text-sm"
                  />
                  <span className="text-xs text-slate-400">°</span>
                  <button onClick={() => setSectionRotation(s.id, 0)} className="ml-auto text-xs font-semibold text-slate-500 hover:text-slate-700">Reset</button>
                </div>
              </div>
            );
          })}
        </div>

        <Button onClick={addSection} variant="outline" className="w-full h-12 border-emerald-300 text-emerald-700 border-dashed">
          <Plus size={18} className="mr-2" /> Add Section {LETTERS[sections.length] || ""}
        </Button>

        {/* Notes */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <Label className="text-sm font-semibold">Project notes</Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full mt-1 rounded-md border border-input p-2 text-sm min-h-[70px]"
            placeholder="Site notes, verification status, product selections…"
          />
        </div>

        {/* Obstacles + drag-and-drop visualizer */}
        <ObstacleToolkit
          grossArea={totalArea}
          sections={vizSections}
          deductions={deductions}
          setDeductions={setDeductions}
          visualizer={visualizer}
          onVisualizerChange={setVisualizer}
          editable
        />

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
              <button onClick={() => setWaste(0)} className={`px-3 py-2 rounded-lg text-sm font-semibold ${waste === 0 ? "bg-slate-200 text-slate-700" : "bg-emerald-700 text-white"}`}>None</button>
              {WASTE_OPTIONS.map((w) => (
                <button key={w.value} onClick={() => setWaste(waste === w.value ? 0 : w.value)} className={`px-3 py-2 rounded-lg text-sm font-semibold ${waste === w.value ? "bg-amber-400 text-emerald-900" : "bg-emerald-700 text-white"}`}>{w.label}</button>
              ))}
            </div>
          </div>
          {deductionAmount > 0 && (
            <div className="bg-rose-500/90 text-white rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold">Less obstacles</div>
                <div className="text-xs text-rose-100">− {formatValue(deductionAmount, "hundredth")} sf</div>
              </div>
              <div className="text-lg font-extrabold">{formatValue(totalWithWaste, "hundredth")} sf</div>
            </div>
          )}
          <div className="bg-amber-400 text-emerald-900 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold">Final total</div>
              <div className="text-xs text-emerald-800">
                {formatValue(totalArea, "hundredth")} sf + {formatValue(wasteArea, "hundredth")} waste{deductionAmount > 0 && ` − ${formatValue(deductionAmount, "hundredth")} ded`}
              </div>
            </div>
            <div className="text-2xl font-extrabold">{formatValue(finalTotal, "hundredth")} sf</div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full h-12 bg-emerald-700">
          <Save size={18} className="mr-2" /> {saving ? "Saving…" : linkedProjectId ? "Save Changes" : "Save as New Project"}
        </Button>
        {linkedProjectId && (
          <Button variant="outline" onClick={() => navigate(`/projects/${linkedProjectId}`)} className="w-full h-11">
            View saved project
          </Button>
        )}
      </div>
    </div>
  );
}

function SaveStatus({ status, linked }) {
  const map = {
    idle: { label: "", cls: "" },
    unsaved: { label: "Unsaved changes", cls: "bg-amber-500 text-white" },
    saving: { label: "Saving…", cls: "bg-slate-500 text-white" },
    saved: { label: "Saved", cls: "bg-emerald-500 text-white" },
    error: { label: "Save failed — local copy kept", cls: "bg-rose-500 text-white" },
  };
  const s = map[status] || map.idle;
  if (!s.label) return null;
  return <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${s.cls}`}>{s.label}</span>;
}

function NumField({ label, value, onChange }) {
  return (
    <div>
      <Label className="text-xs font-semibold">{label}</Label>
      <Input type="number" inputMode="decimal" step="0.01" value={value} onChange={(e) => onChange(e.target.value)} className="h-12 mt-1 text-base" placeholder="0" />
    </div>
  );
}
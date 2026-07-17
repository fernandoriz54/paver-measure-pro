import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, Trash2, Save, Printer, Copy, FileText, LayoutGrid, AlertTriangle, Ruler, Scissors, Map, ClipboardList } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { formatValue } from "@/lib/measurementUtils";
import { deductArea, deductFormula, fmt } from "@/lib/deductionUtils";
import { hydrate } from "@/lib/builderPersistence";
import VisualPlan from "@/components/VisualPlan";

const SECTION_TYPES = [
  { value: "rectangle", label: "Rectangle / Square" },
  { value: "circle", label: "Circle / Curved" },
  { value: "triangle", label: "Triangle" },
  { value: "trapezoid", label: "Trapezoid" },
  { value: "other", label: "Other / Custom" },
];

const TABS = [
  { id: "overview", label: "Overview", icon: ClipboardList },
  { id: "measurements", label: "Measurements", icon: Ruler },
  { id: "deductions", label: "Deductions", icon: Scissors },
  { id: "visualizer", label: "Visualizer", icon: Map },
  { id: "report", label: "Report", icon: FileText },
];

// Map a saved Builder section to the shape params VisualPlan expects.
function sectionToViz(s) {
  const m = s.measurements || {};
  const base = { id: String(s.id), label: s.label, name: s.name };
  switch (s.shape) {
    case "rectangle": return { ...base, type: "rectangle", params: { length: parseFloat(m.lengthFt) || 0, width: parseFloat(m.widthFt) || 0 } };
    case "circle": return { ...base, type: "circle", params: { radius: (parseFloat(m.diameter) || 0) / 2 } };
    case "triangle": return { ...base, type: "triangle", params: { base: parseFloat(m.baseFt) || 0, height: parseFloat(m.heightFt) || 0 } };
    case "trapezoid": return { ...base, type: "trapezoid", params: { a: parseFloat(m.sideA) || 0, b: parseFloat(m.sideB) || 0, height: parseFloat(m.heightFt) || 0 } };
    default: return { ...base, type: "rectangle", params: { length: 0, width: 0 } };
  }
}

function computeSection(section) {
  const m = section.measurements || {};
  const num = (v) => parseFloat(v) || 0;
  let area = 0, perimeter = 0, formula = "";
  switch (section.shape) {
    case "rectangle":
      area = num(m.lengthFt) * num(m.widthFt);
      perimeter = 2 * (num(m.lengthFt) + num(m.widthFt));
      formula = `${num(m.lengthFt)} × ${num(m.widthFt)} = ${fmt(area)}`;
      break;
    case "circle":
      area = Math.PI * Math.pow(num(m.diameter) / 2, 2);
      perimeter = Math.PI * num(m.diameter);
      formula = `π × (${num(m.diameter)}/2)² = ${fmt(area)}`;
      break;
    case "triangle":
      area = 0.5 * num(m.baseFt) * num(m.heightFt);
      formula = `½ × ${num(m.baseFt)} × ${num(m.heightFt)} = ${fmt(area)}`;
      break;
    case "trapezoid":
      area = 0.5 * (num(m.sideA) + num(m.sideB)) * num(m.heightFt);
      formula = `½ × (${num(m.sideA)} + ${num(m.sideB)}) × ${num(m.heightFt)} = ${fmt(area)}`;
      break;
    default: break;
  }
  return { area, perimeter, formula };
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState(null);
  const [builder, setBuilder] = useState(null); // hydrated builder state
  const [sections, setSections] = useState([]); // legacy Section records (old projects)
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [adding, setAdding] = useState(false);
  const [newSection, setNewSection] = useState({ section_name: "", calculator_type: "rectangle", area: "", perimeter: "", notes: "" });

  useEffect(() => {
    (async () => {
      try {
        const proj = await base44.entities.Project.get(id);
        setProject(proj);
        if (proj.builder_state && Object.keys(proj.builder_state).length) {
          setBuilder(hydrate(proj.builder_state));
        } else {
          const secs = await base44.entities.Section.filter({ project_id: id }, "sort_order", 100);
          setSections(secs);
        }
      } catch (e) {
        toast({ title: "Failed to load project", description: e.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Legacy section add (only for old/summary-only projects)
  const handleAddSection = async () => {
    if (!newSection.section_name.trim()) { toast({ title: "Section name required", variant: "destructive" }); return; }
    try {
      const label = String.fromCharCode(65 + sections.length) || `S${sections.length + 1}`;
      const created = await base44.entities.Section.create({
        project_id: id,
        label,
        section_name: newSection.section_name,
        calculator_type: newSection.calculator_type,
        results: { area: parseFloat(newSection.area) || 0, perimeter: parseFloat(newSection.perimeter) || 0 },
        notes: newSection.notes,
        sort_order: sections.length,
      });
      setSections((prev) => [...prev, created]);
      setNewSection({ section_name: "", calculator_type: "rectangle", area: "", perimeter: "", notes: "" });
      setAdding(false);
      toast({ title: "Section added" });
    } catch (e) {
      toast({ title: "Failed to add section", description: e.message, variant: "destructive" });
    }
  };

  const handleDeleteSection = async (sectionId) => {
    try { await base44.entities.Section.delete(sectionId); setSections((prev) => prev.filter((s) => s.id !== sectionId)); toast({ title: "Section removed" }); }
    catch (e) { toast({ title: "Failed to delete", description: e.message, variant: "destructive" }); }
  };

  const handleDuplicate = async () => {
    try {
      const dup = await base44.entities.Project.create({
        client_name: `${project.client_name} (Copy)`,
        builder_state: project.builder_state || {},
        builder_version: project.builder_version || 1,
        last_saved_date: new Date().toISOString(),
      });
      toast({ title: "Project duplicated" });
      navigate(`/projects/${dup.id}`);
    } catch (e) { toast({ title: "Failed to duplicate", description: e.message, variant: "destructive" }); }
  };

  const openInBuilder = () => navigate(`/builder?projectId=${id}`);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  if (!project) return <div className="min-h-screen flex items-center justify-center text-slate-400">Project not found</div>;

  const isFull = !!builder;
  const bSections = builder?.sections || [];
  const bDeductions = builder?.deductions || [];
  const grossArea = builder?.grossArea ?? sections.reduce((s, x) => s + (parseFloat(x.results?.area) || 0), 0);
  const deductionArea = builder?.deductionArea ?? 0;
  const netArea = builder?.netArea ?? grossArea;
  const waste = builder?.waste ?? 0;
  const wasteArea = grossArea * (waste / 100);
  const finalTotal = builder?.finalTotal ?? grossArea + wasteArea;
  const perimeter = builder?.perimeter ?? sections.reduce((s, x) => s + (parseFloat(x.results?.perimeter) || 0), 0);

  const vizSections = bSections.map(sectionToViz);
  // attach deductions to first section for the visualizer
  if (vizSections.length) vizSections[0].deductions = bDeductions;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="sticky top-0 z-20 bg-emerald-800 text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <button onClick={() => navigate("/projects")} className="p-2 -ml-2 rounded-lg hover:bg-emerald-700"><ChevronLeft size={24} /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{project.client_name}</h1>
          {project.project_address && <p className="text-xs text-emerald-100 truncate">{project.project_address}</p>}
        </div>
        <button onClick={() => window.print()} className="p-2 rounded-lg hover:bg-emerald-700 no-print"><Printer size={20} /></button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Open in Builder — primary action */}
        <button onClick={openInBuilder} className="w-full flex items-center justify-center gap-2 bg-emerald-700 text-white rounded-2xl py-4 font-bold shadow-md active:scale-95 transition no-print">
          <LayoutGrid size={20} /> Open in Estimate Builder
        </button>

        {!isFull && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-sm text-amber-800 flex gap-2">
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
            <div>This project was saved before full Builder preservation was enabled. Summary data is available, but the original raw measurements, deductions, and visualizer were not stored. Open it in the Builder to add the full detail going forward.</div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto bg-white rounded-xl border border-slate-200 p-1 no-print">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${tab === t.id ? "bg-emerald-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                <Icon size={15} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-1">
              <div className="flex items-center gap-2 mb-2"><FileText size={18} className="text-emerald-700" /><h2 className="font-bold text-slate-800">Project Information</h2></div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div><span className="text-slate-400">Client:</span> {project.client_name}</div>
                {project.project_address && <div><span className="text-slate-400">Address:</span> {project.project_address}</div>}
                {project.phone && <div><span className="text-slate-400">Phone:</span> {project.phone}</div>}
                {project.email && <div><span className="text-slate-400">Email:</span> {project.email}</div>}
                {project.appointment_date && <div><span className="text-slate-400">Appt:</span> {project.appointment_date}</div>}
                {project.project_type && <div><span className="text-slate-400">Type:</span> {project.project_type}</div>}
                {project.product_name && <div><span className="text-slate-400">Product:</span> {project.product_name}</div>}
                {project.product_color && <div><span className="text-slate-400">Color:</span> {project.product_color}</div>}
                {project.product_size && <div><span className="text-slate-400">Size:</span> {project.product_size}</div>}
                {project.installation_pattern && <div><span className="text-slate-400">Pattern:</span> {project.installation_pattern}</div>}
                {project.last_saved_date && <div><span className="text-slate-400">Last saved:</span> {new Date(project.last_saved_date).toLocaleString()}</div>}
              </div>
              {project.notes && <p className="text-sm text-slate-600 mt-2 pt-2 border-t border-slate-100">{project.notes}</p>}
            </div>

            <div className="bg-emerald-800 text-white rounded-2xl p-5 shadow-lg">
              <h2 className="font-bold text-lg mb-3">Totals</h2>
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Gross" value={formatValue(grossArea, "hundredth")} unit="sf" />
                <Stat label="Deductions" value={formatValue(deductionArea, "hundredth")} unit="sf" />
                <Stat label="Net" value={formatValue(netArea, "hundredth")} unit="sf" />
                <Stat label="Waste" value={`${waste}%`} unit="" />
                <Stat label="Final" value={formatValue(finalTotal, "hundredth")} unit="sf" />
                <Stat label="Sections" value={String(bSections.length || sections.length)} unit="" />
              </div>
              <div className="text-center text-xs text-emerald-100 mt-3">Total perimeter: {formatValue(perimeter, "hundredth")} lin ft</div>
            </div>
          </div>
        )}

        {/* MEASUREMENTS */}
        {tab === "measurements" && (
          <div className="space-y-3">
            {isFull ? (
              bSections.length === 0 ? (
                <Empty label="No sections." />
              ) : bSections.map((s) => {
                const c = computeSection(s);
                return (
                  <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-bold flex items-center justify-center flex-shrink-0">{s.label}</span>
                      <h3 className="font-semibold text-slate-800 flex-1">{s.name || `Section ${s.label}`}</h3>
                      <span className="text-xs text-slate-400 capitalize">{s.shape}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      {Object.entries(s.measurements || {}).filter(([, v]) => v !== "" && v != null).map(([k, v]) => (
                        <div key={k} className="capitalize"><span className="text-slate-400">{k}: </span><strong>{v} ft</strong></div>
                      ))}
                    </div>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-slate-600">Area: <strong>{formatValue(c.area, "hundredth")}</strong> sf</span>
                      {c.perimeter > 0 && <span className="text-slate-600">Perim: <strong>{formatValue(c.perimeter, "hundredth")}</strong> lf</span>}
                      {s.rotation ? <span className="text-slate-600">Rotation: <strong>{s.rotation}°</strong></span> : null}
                    </div>
                    <div className="text-xs text-slate-500 font-mono bg-slate-50 rounded-md px-2 py-1.5 mt-2">{c.formula}</div>
                    {s.notes && <p className="text-xs text-slate-500 mt-2">{s.notes}</p>}
                  </div>
                );
              })
            ) : (
              <>
                {/* Legacy summary sections */}
                {sections.length === 0 ? <Empty label="No sections." /> : sections.map((s) => (
                  <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-3">
                    <div className="flex items-start gap-2">
                      <span className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-bold flex items-center justify-center flex-shrink-0">{s.label}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800">{s.section_name}</h3>
                        <p className="text-xs text-slate-400 capitalize">{s.calculator_type}</p>
                        <div className="flex gap-4 mt-1 text-sm"><span className="text-slate-600">Area: <strong>{formatValue(s.results?.area || 0, "hundredth")}</strong> sq ft</span>{s.results?.perimeter > 0 && <span className="text-slate-600">Perim: <strong>{formatValue(s.results?.perimeter || 0, "hundredth")}</strong> lin ft</span>}</div>
                        {s.notes && <p className="text-xs text-slate-500 mt-1">{s.notes}</p>}
                      </div>
                      <button onClick={() => handleDeleteSection(s.id)} className="p-2 text-red-500 no-print"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
                {adding && (
                  <div className="bg-white rounded-xl border border-emerald-300 p-4 space-y-3 no-print">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-sm font-semibold">Section Name</Label><Input value={newSection.section_name} onChange={(e) => setNewSection({ ...newSection, section_name: e.target.value })} className="h-11 mt-1" /></div>
                      <div><Label className="text-sm font-semibold">Type</Label>
                        <Select value={newSection.calculator_type} onValueChange={(v) => setNewSection({ ...newSection, calculator_type: v })}><SelectTrigger className="h-11 mt-1"><SelectValue /></SelectTrigger><SelectContent>{SECTION_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-sm font-semibold">Area (sq ft)</Label><Input type="number" value={newSection.area} onChange={(e) => setNewSection({ ...newSection, area: e.target.value })} className="h-11 mt-1" /></div>
                      <div><Label className="text-sm font-semibold">Perimeter (lin ft)</Label><Input type="number" value={newSection.perimeter} onChange={(e) => setNewSection({ ...newSection, perimeter: e.target.value })} className="h-11 mt-1" /></div>
                    </div>
                    <Textarea placeholder="Notes..." value={newSection.notes} onChange={(e) => setNewSection({ ...newSection, notes: e.target.value })} className="min-h-[60px]" />
                    <div className="flex gap-2"><Button onClick={handleAddSection} className="flex-1 bg-emerald-700"><Save size={16} className="mr-1" /> Save Section</Button><Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button></div>
                  </div>
                )}
                {!adding && <Button size="sm" onClick={() => setAdding(true)} className="bg-emerald-700 no-print"><Plus size={16} className="mr-1" /> Add Section</Button>}
              </>
            )}
          </div>
        )}

        {/* DEDUCTIONS */}
        {tab === "deductions" && (
          <div className="space-y-3">
            {!isFull ? <Empty label="Deductions were not stored for this older project." /> :
             bDeductions.length === 0 ? <Empty label="No deductions." /> :
             bDeductions.map((d) => {
               const area = deductArea(d.kind, d.params, d.quantity || 1);
               return (
                 <div key={d.id} className="bg-white rounded-xl border border-slate-200 p-3" style={{ borderLeftWidth: 4, borderLeftColor: d.color || "#dc2626" }}>
                   <div className="flex items-center gap-2">
                     <h3 className="font-semibold text-slate-800 flex-1">{d.label || d.name}</h3>
                     <span className="text-xs text-slate-400 capitalize">{d.kind}</span>
                   </div>
                   <div className="text-sm text-slate-600 mt-1">
                     {Object.entries(d.params || {}).filter(([, v]) => v != null && v !== "" && v !== 0).map(([k, v]) => (
                       <span key={k} className="inline-block mr-3 capitalize">{k}: <strong>{v}</strong></span>
                     ))}
                     {d.quantity > 1 && <span>qty: <strong>{d.quantity}</strong></span>}
                   </div>
                   <div className="flex flex-wrap gap-3 mt-1 text-sm">
                     <span className="text-rose-700 font-semibold">−{fmt(area)} sq ft</span>
                     {d.section && <span className="text-slate-500">Section: {d.section}</span>}
                   </div>
                   <div className="text-xs text-slate-500 font-mono bg-slate-50 rounded-md px-2 py-1.5 mt-2">{deductFormula(d.kind, d.params, area, d.quantity || 1)}</div>
                   <div className="flex gap-3 mt-2 text-xs">
                     <Tag on={d.subtract !== false} label="Subtract from total" />
                     <Tag on={d.includeReport !== false} label="Include in report" />
                   </div>
                   {d.notes && <p className="text-xs text-slate-500 mt-2">{d.notes}</p>}
                 </div>
               );
             })}
          </div>
        )}

        {/* VISUALIZER */}
        {tab === "visualizer" && (
          <div className="space-y-3">
            {!isFull ? <Empty label="Visualizer data was not stored for this older project." /> :
             vizSections.length === 0 ? <Empty label="No shapes to display." /> :
             <VisualPlan sections={vizSections} initialLayout={builder?.visualizer} editable />
            }
          </div>
        )}

        {/* REPORT */}
        {tab === "report" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="font-bold text-slate-800 mb-2">Summary</h2>
              <Row label="Gross area" value={`${formatValue(grossArea, "hundredth")} sf`} />
              <Row label="Less deductions" value={`−${formatValue(deductionArea, "hundredth")} sf`} />
              <Row label="Net area" value={`${formatValue(netArea, "hundredth")} sf`} />
              <Row label={`Waste (${waste}%)`} value={`+${formatValue(wasteArea, "hundredth")} sf`} />
              <Row label="Final quantity" value={`${formatValue(finalTotal, "hundredth")} sf`} bold />
              <Row label="Total perimeter" value={`${formatValue(perimeter, "hundredth")} lf`} />
            </div>

            {isFull && bSections.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-800 mb-2">Measurement Tables</h3>
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-slate-400 border-b border-slate-100"><th className="py-1">Sec</th><th>Name</th><th>Shape</th><th className="text-right">Area</th><th className="text-right">Perim</th></tr></thead>
                  <tbody>
                    {bSections.map((s) => { const c = computeSection(s); return (
                      <tr key={s.id} className="border-b border-slate-50"><td className="py-1 font-semibold">{s.label}</td><td>{s.name || `Section ${s.label}`}</td><td className="capitalize">{s.shape}</td><td className="text-right">{formatValue(c.area, "hundredth")}</td><td className="text-right">{formatValue(c.perimeter, "hundredth")}</td></tr>
                    ); })}
                  </tbody>
                </table>
              </div>
            )}

            {isFull && bDeductions.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-800 mb-2">Deductions</h3>
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-slate-400 border-b border-slate-100"><th className="py-1">Name</th><th className="text-right">Area</th><th className="text-right">Subtract</th></tr></thead>
                  <tbody>
                    {bDeductions.map((d) => { const a = deductArea(d.kind, d.params, d.quantity || 1); return (
                      <tr key={d.id} className="border-b border-slate-50"><td className="py-1">{d.label || d.name}</td><td className="text-right text-rose-700">−{fmt(a)}</td><td className="text-right">{d.subtract === false ? "No" : "Yes"}</td></tr>
                    ); })}
                  </tbody>
                </table>
              </div>
            )}

            {isFull && builder?.notes && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-800 mb-1">Notes</h3>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{builder.notes}</p>
              </div>
            )}

            {isFull && vizSections.length > 0 && (
              <VisualPlan sections={vizSections} initialLayout={builder?.visualizer} editable={false} />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 no-print">
          <Button variant="outline" onClick={handleDuplicate} className="h-12"><Copy size={16} className="mr-2" /> Duplicate</Button>
          <Button variant="outline" onClick={() => window.print()} className="h-12"><Printer size={16} className="mr-2" /> Print / Export</Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, unit }) {
  return (
    <div className="bg-emerald-700 rounded-xl p-3 text-center">
      <div className="text-2xl font-extrabold">{value}{unit && <span className="text-xs ml-0.5">{unit}</span>}</div>
      <div className="text-xs text-emerald-100">{label}</div>
    </div>
  );
}
function Row({ label, value, bold }) {
  return (
    <div className={`flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0 ${bold ? "font-bold text-emerald-800" : "text-slate-700"}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
function Tag({ on, label }) {
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${on ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>{on ? "✓ " : ""}{label}</span>;
}
function Empty({ label }) {
  return <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">{label}</div>;
}
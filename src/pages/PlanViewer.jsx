import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Map, Printer, LayoutGrid, AlertTriangle, FolderOpen, Layers, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { formatValue } from "@/lib/measurementUtils";
import { deductArea } from "@/lib/deductionUtils";
import { hydrate } from "@/lib/builderPersistence";
import { sectionToViz, computeSection } from "@/lib/projectSections";
import VisualPlan from "@/components/VisualPlan";

const PALETTE = ["#0f766e", "#1d4ed8", "#b45309", "#7c3aed", "#be123c", "#0369a1", "#ca8a04", "#15803d"];

export default function PlanViewer() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const projectId = params.get("projectId");
  const { toast } = useToast();

  const [project, setProject] = useState(null);
  const [builder, setBuilder] = useState(null);
  const [sections, setSections] = useState([]); // legacy summary sections
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setLoading(true);
      base44.entities.Project.list("-created_date", 100)
        .then(setProjects)
        .catch((e) => toast({ title: "Failed to load projects", description: e.message, variant: "destructive" }))
        .finally(() => setLoading(false));
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const proj = await base44.entities.Project.get(projectId);
        setProject(proj);
        if (proj.builder_state && Object.keys(proj.builder_state).length) {
          setBuilder(hydrate(proj.builder_state));
        } else {
          const secs = await base44.entities.Section.filter({ project_id: projectId }, "sort_order", 100);
          setSections(secs);
        }
      } catch (e) {
        toast({ title: "Failed to load project", description: e.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  const bSections = builder?.sections || [];
  const bDeductions = builder?.deductions || [];

  const vizSections = useMemo(() => {
    const list = bSections.map(sectionToViz);
    if (list.length) list[0].deductions = bDeductions;
    return list;
  }, [bSections, bDeductions]);

  const totals = useMemo(() => {
    const gross = bSections.reduce((s, x) => s + (computeSection(x).area || 0), 0);
    const perim = bSections.reduce((s, x) => s + (computeSection(x).perimeter || 0), 0);
    const ded = bDeductions.reduce((s, d) => s + (d.subtract === false ? 0 : deductArea(d.kind, d.params, d.quantity || 1)), 0);
    const waste = builder?.waste ?? 0;
    const wasteArea = gross * (waste / 100);
    return {
      gross: builder?.grossArea ?? gross,
      deductions: builder?.deductionArea ?? ded,
      net: builder?.netArea ?? gross - ded,
      perimeter: builder?.perimeter ?? perim,
      waste,
      wasteArea,
      final: builder?.finalTotal ?? gross - ded + wasteArea,
    };
  }, [bSections, bDeductions, builder]);

  const isFull = !!builder;
  const hasShapes = vizSections.length > 0;

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;

  // ---------- Project picker ----------
  if (!projectId) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <Header title="Plan Viewer" subtitle="Pick a project to view all sections on one canvas" onBack={() => navigate("/")} />
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
          {projects.length === 0 ? (
            <div className="text-center py-16">
              <FolderOpen size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No projects yet</p>
              <button onClick={() => navigate("/projects/new")} className="text-emerald-700 font-semibold mt-2">Create your first project</button>
            </div>
          ) : (
            projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setParams({ projectId: p.id })}
                className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition active:scale-[0.99] flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center"><Map size={18} className="text-white" /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{p.client_name}</h3>
                  {p.project_address && <p className="text-sm text-slate-500 truncate">{p.project_address}</p>}
                </div>
                <ChevronLeft size={18} className="text-slate-300 rotate-180" />
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  if (!project) return <div className="min-h-screen flex items-center justify-center text-slate-400">Project not found</div>;

  // ---------- Viewer ----------
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Header
        title="Plan Viewer"
        subtitle={project.client_name}
        onBack={() => navigate("/projects")}
        right={<button onClick={() => window.print()} className="p-2 rounded-lg hover:bg-emerald-700 no-print"><Printer size={20} /></button>}
      />

      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Totals strip */}
        <div className="bg-emerald-800 text-white rounded-2xl p-4 shadow-lg">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            <Stat label="Gross" value={formatValue(totals.gross, "hundredth")} unit="sf" />
            <Stat label="Deduct" value={formatValue(totals.deductions, "hundredth")} unit="sf" />
            <Stat label="Net" value={formatValue(totals.net, "hundredth")} unit="sf" />
            <Stat label="Waste" value={`${totals.waste}%`} unit="" />
            <Stat label="Final" value={formatValue(totals.final, "hundredth")} unit="sf" />
            <Stat label="Sections" value={String(bSections.length || sections.length)} unit="" />
          </div>
          <div className="text-center text-xs text-emerald-100 mt-2">Total perimeter: {formatValue(totals.perimeter, "hundredth")} lin ft</div>
        </div>

        {!isFull && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-sm text-amber-800 flex gap-2">
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
            <div>This project has summary data only — raw shapes weren't stored, so they can't be drawn on the canvas. Open it in the Builder to capture full detail.</div>
          </div>
        )}

        {/* Canvas */}
        {hasShapes ? (
          <VisualPlan sections={vizSections} initialLayout={builder?.visualizer} editable />
        ) : (
          <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            {isFull ? "No sections to display." : "No drawable shapes for this project."}
          </div>
        )}

        {/* Section legend */}
        {isFull && bSections.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Layers size={16} className="text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">Section Legend</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {bSections.map((s, i) => {
                const c = computeSection(s);
                const color = PALETTE[i % PALETTE.length];
                return (
                  <div key={s.id} className="flex items-center gap-2 text-sm">
                    <span className="w-4 h-4 rounded border-2 flex-shrink-0" style={{ borderColor: color, background: color + "22" }} />
                    <span className="font-semibold text-slate-800 w-6">{s.label}</span>
                    <span className="text-slate-600 truncate flex-1">{s.name || `Section ${s.label}`}</span>
                    <span className="text-slate-500 text-xs capitalize hidden sm:inline">{s.shape}</span>
                    <span className="font-semibold text-slate-700">{formatValue(c.area, "hundredth")} sf</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Verification + actions */}
        {isFull && hasShapes && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-sm">Layout Verification</h3>
            </div>
            <ul className="space-y-1.5 text-sm text-slate-600">
              <Verify ok={totals.net > 0} text={`Net area is positive (${formatValue(totals.net, "hundredth")} sf)`} />
              <Verify ok={bSections.length >= 1} text={`${bSections.length} section${bSections.length === 1 ? "" : "s"} on canvas`} />
              <Verify ok={totals.deductions > 0 || bDeductions.length === 0} text={totals.deductions > 0 ? `${bDeductions.length} deduction${bDeductions.length === 1 ? "" : "s"} applied` : "No deductions"} />
              <Verify ok={totals.waste > 0} text={`Waste factor ${totals.waste}% included`} />
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 no-print">
          <button onClick={() => navigate(`/builder?projectId=${projectId}`)} className="flex items-center justify-center gap-2 bg-emerald-700 text-white rounded-2xl py-4 font-bold shadow-md active:scale-95 transition">
            <LayoutGrid size={20} /> Open in Estimate Builder
          </button>
          <button onClick={() => navigate(`/projects/${projectId}`)} className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 rounded-2xl py-4 font-bold shadow-sm active:scale-95 transition">
            <FolderOpen size={20} /> Project Details
          </button>
        </div>
      </div>
    </div>
  );
}

function Header({ title, subtitle, onBack, right }) {
  return (
    <div className="sticky top-0 z-20 bg-emerald-800 text-white px-4 py-3 flex items-center gap-3 shadow-md">
      <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-emerald-700"><ChevronLeft size={24} /></button>
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold truncate">{title}</h1>
        {subtitle && <p className="text-xs text-emerald-100 truncate">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

function Stat({ label, value, unit }) {
  return (
    <div className="bg-emerald-700 rounded-xl p-2.5 text-center">
      <div className="text-xl font-extrabold leading-none">{value}{unit && <span className="text-[10px] ml-0.5">{unit}</span>}</div>
      <div className="text-[11px] text-emerald-100 mt-1">{label}</div>
    </div>
  );
}

function Verify({ ok, text }) {
  return (
    <li className="flex items-center gap-2">
      <CheckCircle2 size={15} className={ok ? "text-emerald-600" : "text-slate-300"} />
      <span className={ok ? "text-slate-700" : "text-slate-400"}>{text}</span>
    </li>
  );
}
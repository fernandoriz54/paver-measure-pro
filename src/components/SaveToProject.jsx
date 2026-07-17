import React, { useState } from "react";
import { FolderPlus, Save, ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";

// Save the combined calc sections to a Project (create one or pick an existing client folder).
export default function SaveToProject({ sections }) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState("existing"); // 'existing' | 'new'
  const [projectId, setProjectId] = useState("");
  const [clientName, setClientName] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProjects = async () => {
    if (loaded) return;
    try {
      const list = await base44.entities.Project.list();
      setProjects(list || []);
      if (list && list.length) setProjectId(list[0].id);
      setLoaded(true);
    } catch {
      setLoaded(true);
    }
  };

  const toggle = () => {
    setOpen((o) => !o);
    if (!open) loadProjects();
  };

  const save = async () => {
    if (mode === "new" && !clientName.trim()) {
      toast({ title: "Enter a client name", variant: "destructive" });
      return;
    }
    if (mode === "existing" && !projectId) {
      toast({ title: "Pick a project or create a new one", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let id = projectId;
      if (mode === "new") {
        const proj = await base44.entities.Project.create({ client_name: clientName.trim() });
        id = proj.id;
        setProjects((p) => [proj, ...p]);
        setProjectId(id);
        setMode("existing");
      }
      await base44.entities.Section.bulkCreate(
        sections.map((s) => ({
          project_id: id,
          label: s.label,
          section_name: s.label,
          calculator_type: "combined",
          measurements: { type: s.type, params: s.params, deductions: s.deductions },
          results: {
            gross: s.gross,
            totalDeduct: s.totalDeduct,
            net: s.net,
            linear: s.type === "path" ? s.params.linear || 0 : 0,
          },
        }))
      );
      toast({ title: "Saved to project", description: `${sections.length} section(s) stored.` });
    } catch (e) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
      >
        <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center">
          <FolderPlus size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-slate-800 text-sm">Save to Project</h2>
          <p className="text-xs text-slate-500">Store these sections under a client folder.</p>
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          <div className="flex gap-2">
            <button
              onClick={() => setMode("existing")}
              className={`flex-1 text-xs font-semibold py-2 rounded-lg ${mode === "existing" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              Existing Project
            </button>
            <button
              onClick={() => setMode("new")}
              className={`flex-1 text-xs font-semibold py-2 rounded-lg ${mode === "new" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              New Client
            </button>
          </div>

          {mode === "existing" ? (
            loaded && projects.length ? (
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full h-11 rounded-lg border border-input bg-transparent px-3 text-sm"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.client_name}{p.project_address ? ` — ${p.project_address}` : ""}</option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                No projects yet. Switch to “New Client” to create one.
              </p>
            )
          ) : (
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client name (e.g. Johnson residence)"
              className="w-full h-11 rounded-lg border border-input bg-transparent px-3 text-sm"
            />
          )}

          <button
            onClick={save}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-emerald-700 text-white rounded-xl py-3 font-bold shadow-sm active:scale-95 disabled:opacity-50 transition"
          >
            <Save size={18} /> {saving ? "Saving…" : "Save Sections"}
          </button>
        </div>
      )}
    </div>
  );
}
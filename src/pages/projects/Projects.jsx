import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, MapPin, Calendar, FolderOpen, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

export default function Projects() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.Project.list("-created_date", 100);
        setProjects(list);
      } catch (e) {
        toast({ title: "Failed to load projects", description: e.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = projects.filter(
    (p) =>
      (p.client_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.project_address || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="sticky top-0 z-20 bg-emerald-800 text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-lg hover:bg-emerald-700"><ChevronLeft size={24} /></button>
        <h1 className="text-lg font-bold flex-1">Saved Projects</h1>
        <button onClick={() => navigate("/projects/new")} className="p-2 rounded-lg hover:bg-emerald-700"><Plus size={24} /></button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search by client or address..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-12 pl-10 text-base" />
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading projects...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FolderOpen size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No projects yet</p>
            <button onClick={() => navigate("/projects/new")} className="text-emerald-700 font-semibold mt-2">Create your first project</button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition active:scale-[0.99]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 text-base">{p.client_name}</h3>
                    {p.project_address && (
                      <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={13} /> {p.project_address}
                      </p>
                    )}
                  </div>
                  {p.project_type && (
                    <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md">{p.project_type}</span>
                  )}
                </div>
                {p.appointment_date && (
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                    <Calendar size={12} /> {p.appointment_date}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
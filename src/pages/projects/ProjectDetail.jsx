import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, Trash2, Save, Printer, Copy, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { formatValue } from "@/lib/measurementUtils";

const SECTION_TYPES = [
  { value: "rectangle", label: "Rectangle / Square" },
  { value: "circle", label: "Circle / Curved" },
  { value: "triangle", label: "Triangle" },
  { value: "paver", label: "Paver Field" },
  { value: "turf", label: "Turf" },
  { value: "border", label: "Border / Edging" },
  { value: "steps", label: "Steps & Stairs" },
  { value: "irregular", label: "Irregular Area" },
  { value: "other", label: "Other / Custom" },
];

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [project, setProject] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newSection, setNewSection] = useState({ section_name: "", calculator_type: "rectangle", area: "", perimeter: "", notes: "" });

  useEffect(() => {
    (async () => {
      try {
        const [proj, secs] = await Promise.all([
          base44.entities.Project.get(id),
          base44.entities.Section.filter({ project_id: id }, "sort_order", 100),
        ]);
        setProject(proj);
        setSections(secs);
      } catch (e) {
        toast({ title: "Failed to load project", description: e.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const totalArea = sections.reduce((sum, s) => sum + (parseFloat(s.results?.area) || 0), 0);
  const totalPerimeter = sections.reduce((sum, s) => sum + (parseFloat(s.results?.perimeter) || 0), 0);
  const totalLinear = sections.reduce((sum, s) => sum + (parseFloat(s.results?.linear) || 0), 0);

  const handleAddSection = async () => {
    if (!newSection.section_name.trim()) {
      toast({ title: "Section name required", variant: "destructive" });
      return;
    }
    try {
      const label = LETTERS[sections.length] || `S${sections.length + 1}`;
      const results = {
        area: parseFloat(newSection.area) || 0,
        perimeter: parseFloat(newSection.perimeter) || 0,
        linear: parseFloat(newSection.perimeter) || 0,
      };
      const created = await base44.entities.Section.create({
        project_id: id,
        label,
        section_name: newSection.section_name,
        calculator_type: newSection.calculator_type,
        results,
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
    try {
      await base44.entities.Section.delete(sectionId);
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
      toast({ title: "Section removed" });
    } catch (e) {
      toast({ title: "Failed to delete", description: e.message, variant: "destructive" });
    }
  };

  const handleDuplicate = async () => {
    try {
      const dup = await base44.entities.Project.create({
        ...project,
        client_name: `${project.client_name} (Copy)`,
      });
      toast({ title: "Project duplicated" });
      navigate(`/projects/${dup.id}`);
    } catch (e) {
      toast({ title: "Failed to duplicate", description: e.message, variant: "destructive" });
    }
  };

  const handlePrint = () => window.print();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading...</div>;
  if (!project) return <div className="min-h-screen flex items-center justify-center text-slate-400">Project not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="sticky top-0 z-20 bg-emerald-800 text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <button onClick={() => navigate("/projects")} className="p-2 -ml-2 rounded-lg hover:bg-emerald-700"><ChevronLeft size={24} /></button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{project.client_name}</h1>
          {project.project_address && <p className="text-xs text-emerald-100 truncate">{project.project_address}</p>}
        </div>
        <button onClick={handlePrint} className="p-2 rounded-lg hover:bg-emerald-700"><Printer size={20} /></button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Client info */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={18} className="text-emerald-700" />
            <h2 className="font-bold text-slate-800">Project Information</h2>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {project.phone && <div><span className="text-slate-400">Phone:</span> {project.phone}</div>}
            {project.email && <div><span className="text-slate-400">Email:</span> {project.email}</div>}
            {project.appointment_date && <div><span className="text-slate-400">Appt:</span> {project.appointment_date}</div>}
            {project.project_type && <div><span className="text-slate-400">Type:</span> {project.project_type}</div>}
            {project.product_name && <div><span className="text-slate-400">Product:</span> {project.product_name}</div>}
            {project.product_color && <div><span className="text-slate-400">Color:</span> {project.product_color}</div>}
            {project.product_size && <div><span className="text-slate-400">Size:</span> {project.product_size}</div>}
            {project.installation_pattern && <div><span className="text-slate-400">Pattern:</span> {project.installation_pattern}</div>}
          </div>
          {project.notes && <p className="text-sm text-slate-600 mt-2 pt-2 border-t border-slate-100">{project.notes}</p>}
        </div>

        {/* Sections */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-800">Sections</h2>
            <Button size="sm" onClick={() => setAdding(!adding)} className="bg-emerald-700">
              <Plus size={16} className="mr-1" /> Add Section
            </Button>
          </div>

          {adding && (
            <div className="bg-white rounded-xl border border-emerald-300 p-4 space-y-3 mb-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-semibold">Section Name</Label>
                  <Input value={newSection.section_name} onChange={(e) => setNewSection({ ...newSection, section_name: e.target.value })} className="h-11 mt-1" placeholder="Front walkway" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Calculator Type</Label>
                  <Select value={newSection.calculator_type} onValueChange={(v) => setNewSection({ ...newSection, calculator_type: v })}>
                    <SelectTrigger className="h-11 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SECTION_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-semibold">Area (sq ft)</Label>
                  <Input type="number" value={newSection.area} onChange={(e) => setNewSection({ ...newSection, area: e.target.value })} className="h-11 mt-1" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Perimeter (lin ft)</Label>
                  <Input type="number" value={newSection.perimeter} onChange={(e) => setNewSection({ ...newSection, perimeter: e.target.value })} className="h-11 mt-1" />
                </div>
              </div>
              <Textarea placeholder="Notes..." value={newSection.notes} onChange={(e) => setNewSection({ ...newSection, notes: e.target.value })} className="min-h-[60px]" />
              <div className="flex gap-2">
                <Button onClick={handleAddSection} className="flex-1 bg-emerald-700"><Save size={16} className="mr-1" /> Save Section</Button>
                <Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {sections.length === 0 && !adding ? (
            <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
              No sections yet. Add sections like "Front walkway", "Driveway", "Backyard turf".
            </div>
          ) : (
            <div className="space-y-2">
              {sections.map((s) => (
                <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start gap-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-bold flex items-center justify-center flex-shrink-0">{s.label}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800">{s.section_name}</h3>
                      <p className="text-xs text-slate-400 capitalize">{s.calculator_type}</p>
                      <div className="flex gap-4 mt-1 text-sm">
                        <span className="text-slate-600">Area: <strong>{formatValue(s.results?.area || 0, "hundredth")}</strong> sq ft</span>
                        {s.results?.perimeter > 0 && <span className="text-slate-600">Perim: <strong>{formatValue(s.results?.perimeter || 0, "hundredth")}</strong> lin ft</span>}
                      </div>
                      {s.notes && <p className="text-xs text-slate-500 mt-1">{s.notes}</p>}
                    </div>
                    <button onClick={() => handleDeleteSection(s.id)} className="p-2 text-red-500"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-emerald-800 text-white rounded-2xl p-5 shadow-lg">
          <h2 className="font-bold text-lg mb-3">Project Summary</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-700 rounded-xl p-3 text-center">
              <div className="text-2xl font-extrabold">{formatValue(totalArea, "hundredth")}</div>
              <div className="text-xs text-emerald-100">Total Sq Ft</div>
            </div>
            <div className="bg-emerald-700 rounded-xl p-3 text-center">
              <div className="text-2xl font-extrabold">{formatValue(totalPerimeter, "hundredth")}</div>
              <div className="text-xs text-emerald-100">Perimeter (lf)</div>
            </div>
            <div className="bg-emerald-700 rounded-xl p-3 text-center">
              <div className="text-2xl font-extrabold">{sections.length}</div>
              <div className="text-xs text-emerald-100">Sections</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={handleDuplicate} className="h-12"><Copy size={16} className="mr-2" /> Duplicate</Button>
          <Button variant="outline" onClick={handlePrint} className="h-12"><Printer size={16} className="mr-2" /> Print / Export</Button>
        </div>
      </div>
    </div>
  );
}
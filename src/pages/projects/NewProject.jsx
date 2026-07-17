import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Save, Camera } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const PROJECT_TYPES = ["Pavers", "Turf", "Driveway", "Walkway", "Patio", "Lawn", "Steps", "Retaining Wall", "Combo"];

export default function NewProject() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    client_name: "",
    project_address: "",
    phone: "",
    email: "",
    appointment_date: "",
    project_type: "Pavers",
    notes: "",
    product_name: "",
    product_color: "",
    product_size: "",
    installation_pattern: "",
  });

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.client_name.trim()) {
      toast({ title: "Client name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const project = await base44.entities.Project.create(form);
      toast({ title: "Project created" });
      navigate(`/projects/${project.id}`);
    } catch (e) {
      toast({ title: "Failed to save project", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="sticky top-0 z-20 bg-emerald-800 text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-emerald-700"><ChevronLeft size={24} /></button>
        <h1 className="text-lg font-bold">New Project</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        <div>
          <Label className="text-base font-semibold">Client Name *</Label>
          <Input value={form.client_name} onChange={(e) => set("client_name", e.target.value)} className="h-12 text-base mt-1" placeholder="John & Mary Smith" />
        </div>
        <div>
          <Label className="text-base font-semibold">Project Address</Label>
          <Input value={form.project_address} onChange={(e) => set("project_address", e.target.value)} className="h-12 text-base mt-1" placeholder="123 Main St, City" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-base font-semibold">Phone</Label>
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="h-12 text-base mt-1" placeholder="(555) 123-4567" />
          </div>
          <div>
            <Label className="text-base font-semibold">Email</Label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="h-12 text-base mt-1" placeholder="client@email.com" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-base font-semibold">Appointment Date</Label>
            <Input type="date" value={form.appointment_date} onChange={(e) => set("appointment_date", e.target.value)} className="h-12 text-base mt-1" />
          </div>
          <div>
            <Label className="text-base font-semibold">Project Type</Label>
            <Select value={form.project_type} onValueChange={(v) => set("project_type", v)}>
              <SelectTrigger className="h-12 text-base mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROJECT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-2">
          <h2 className="font-bold text-slate-800 mb-2">Product Selection</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-base font-semibold">Product Name</Label>
              <Input value={form.product_name} onChange={(e) => set("product_name", e.target.value)} className="h-12 text-base mt-1" placeholder="Belgard" />
            </div>
            <div>
              <Label className="text-base font-semibold">Color</Label>
              <Input value={form.product_color} onChange={(e) => set("product_color", e.target.value)} className="h-12 text-base mt-1" placeholder="Sandstone" />
            </div>
            <div>
              <Label className="text-base font-semibold">Product Size</Label>
              <Input value={form.product_size} onChange={(e) => set("product_size", e.target.value)} className="h-12 text-base mt-1" placeholder="6 × 9" />
            </div>
            <div>
              <Label className="text-base font-semibold">Installation Pattern</Label>
              <Input value={form.installation_pattern} onChange={(e) => set("installation_pattern", e.target.value)} className="h-12 text-base mt-1" placeholder="Running bond" />
            </div>
          </div>
        </div>

        <div>
          <Label className="text-base font-semibold">Notes</Label>
          <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} className="text-base mt-1 min-h-[100px]" placeholder="Site conditions, access, special requests..." />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full h-14 text-base font-bold bg-emerald-700 hover:bg-emerald-800">
          <Save size={20} className="mr-2" /> {saving ? "Saving..." : "Create Project"}
        </Button>
      </div>
    </div>
  );
}
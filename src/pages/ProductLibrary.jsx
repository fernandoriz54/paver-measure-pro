import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, Trash2, Package, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const PRODUCT_TYPES = ["Paver", "Turf", "Bullnose", "Edging", "Wall Block", "Cap", "Other"];

export default function ProductLibrary() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    manufacturer: "",
    product_name: "",
    product_type: "Paver",
    color: "",
    texture: "",
    length_in: "",
    width_in: "",
    thickness_in: "",
    sqft_per_pallet: "",
    pieces_per_pallet: "",
    linear_feet_per_piece: "",
    coverage_info: "",
    installation_pattern: "",
    notes: "",
  });

  const load = async () => {
    try {
      const list = await base44.entities.Product.list("-created_date", 100);
      setProducts(list);
    } catch (e) {
      toast({ title: "Failed to load products", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.product_name.trim()) {
      toast({ title: "Product name is required", variant: "destructive" });
      return;
    }
    try {
      const payload = {
        ...form,
        length_in: form.length_in ? Number(form.length_in) : null,
        width_in: form.width_in ? Number(form.width_in) : null,
        thickness_in: form.thickness_in ? Number(form.thickness_in) : null,
        sqft_per_pallet: form.sqft_per_pallet ? Number(form.sqft_per_pallet) : null,
        pieces_per_pallet: form.pieces_per_pallet ? Number(form.pieces_per_pallet) : null,
        linear_feet_per_piece: form.linear_feet_per_piece ? Number(form.linear_feet_per_piece) : null,
      };
      await base44.entities.Product.create(payload);
      toast({ title: "Product saved" });
      setForm({ manufacturer: "", product_name: "", product_type: "Paver", color: "", texture: "", length_in: "", width_in: "", thickness_in: "", sqft_per_pallet: "", pieces_per_pallet: "", linear_feet_per_piece: "", coverage_info: "", installation_pattern: "", notes: "" });
      setAdding(false);
      load();
    } catch (e) {
      toast({ title: "Failed to save", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.Product.delete(id);
      load();
      toast({ title: "Product deleted" });
    } catch (e) {
      toast({ title: "Failed to delete", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="sticky top-0 z-20 bg-violet-700 text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-violet-600"><ChevronLeft size={24} /></button>
        <div className="flex items-center gap-2 flex-1">
          <Package size={22} />
          <h1 className="text-lg font-bold">Product Library</h1>
        </div>
        <button onClick={() => setAdding(!adding)} className="p-2 rounded-lg hover:bg-violet-600"><Plus size={24} /></button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {adding && (
          <div className="bg-white rounded-xl border border-violet-300 p-4 space-y-3">
            <h2 className="font-bold text-slate-800">Add Product</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold">Manufacturer</Label>
                <Input value={form.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} className="h-11 mt-1" placeholder="Belgard" />
              </div>
              <div>
                <Label className="text-sm font-semibold">Product Name *</Label>
                <Input value={form.product_name} onChange={(e) => set("product_name", e.target.value)} className="h-11 mt-1" placeholder="Aquia" />
              </div>
              <div>
                <Label className="text-sm font-semibold">Type</Label>
                <Select value={form.product_type} onValueChange={(v) => set("product_type", v)}>
                  <SelectTrigger className="h-11 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold">Color</Label>
                <Input value={form.color} onChange={(e) => set("color", e.target.value)} className="h-11 mt-1" placeholder="Sandstone" />
              </div>
              <div>
                <Label className="text-sm font-semibold">Length (in)</Label>
                <Input type="number" value={form.length_in} onChange={(e) => set("length_in", e.target.value)} className="h-11 mt-1" />
              </div>
              <div>
                <Label className="text-sm font-semibold">Width (in)</Label>
                <Input type="number" value={form.width_in} onChange={(e) => set("width_in", e.target.value)} className="h-11 mt-1" />
              </div>
              <div>
                <Label className="text-sm font-semibold">Thickness (in)</Label>
                <Input type="number" value={form.thickness_in} onChange={(e) => set("thickness_in", e.target.value)} className="h-11 mt-1" />
              </div>
              <div>
                <Label className="text-sm font-semibold">Sq Ft / Pallet</Label>
                <Input type="number" value={form.sqft_per_pallet} onChange={(e) => set("sqft_per_pallet", e.target.value)} className="h-11 mt-1" />
              </div>
              <div>
                <Label className="text-sm font-semibold">Pieces / Pallet</Label>
                <Input type="number" value={form.pieces_per_pallet} onChange={(e) => set("pieces_per_pallet", e.target.value)} className="h-11 mt-1" />
              </div>
              <div>
                <Label className="text-sm font-semibold">Lin Ft / Piece</Label>
                <Input type="number" value={form.linear_feet_per_piece} onChange={(e) => set("linear_feet_per_piece", e.target.value)} className="h-11 mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-sm font-semibold">Installation Pattern</Label>
              <Input value={form.installation_pattern} onChange={(e) => set("installation_pattern", e.target.value)} className="h-11 mt-1" placeholder="Running bond" />
            </div>
            <Textarea placeholder="Notes..." value={form.notes} onChange={(e) => set("notes", e.target.value)} className="min-h-[60px]" />
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1 bg-violet-700"><Save size={16} className="mr-1" /> Save Product</Button>
              <Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading...</div>
        ) : products.length === 0 && !adding ? (
          <div className="text-center py-16">
            <Package size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">No products saved</p>
            <button onClick={() => setAdding(true)} className="text-violet-700 font-semibold mt-2">Add your first product</button>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">{p.product_name}</h3>
                    {p.manufacturer && <p className="text-sm text-slate-500">{p.manufacturer}</p>}
                    <div className="flex flex-wrap gap-2 mt-1">
                      {p.color && <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">{p.color}</span>}
                      {p.product_type && <span className="text-xs bg-violet-100 text-violet-800 px-2 py-0.5 rounded">{p.product_type}</span>}
                      {p.length_in && p.width_in && <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">{p.length_in} × {p.width_in} in</span>}
                      {p.sqft_per_pallet && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{p.sqft_per_pallet} sq ft/pallet</span>}
                    </div>
                    {p.notes && <p className="text-xs text-slate-500 mt-2">{p.notes}</p>}
                  </div>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-red-500"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
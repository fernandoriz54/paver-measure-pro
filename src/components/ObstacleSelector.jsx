import React, { useState, useEffect, useMemo } from "react";
import { Search, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { OBSTACLE_CATALOG, presetByName } from "@/lib/deductionUtils";

const RECENT_KEY = "paver_obs_recent";
const FAV_KEY = "paver_obs_fav";

const load = (k) => {
  try { return JSON.parse(localStorage.getItem(k) || "[]"); } catch { return []; }
};
const save = (k, arr) => {
  try { localStorage.setItem(k, JSON.stringify(arr)); } catch {}
};

// Categorized obstacle picker with search, recently-used and favorites.
export default function ObstacleSelector({ open, onClose, onPick }) {
  const [q, setQ] = useState("");
  const [recent, setRecent] = useState([]);
  const [fav, setFav] = useState([]);

  useEffect(() => {
    if (open) {
      setRecent(load(RECENT_KEY));
      setFav(load(FAV_KEY));
      setQ("");
    }
  }, [open]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return OBSTACLE_CATALOG;
    return OBSTACLE_CATALOG
      .map((c) => ({ ...c, items: c.items.filter((it) => it.name.toLowerCase().includes(term)) }))
      .filter((c) => c.items.length);
  }, [q]);

  const pick = (name) => {
    const next = [name, ...recent.filter((n) => n !== name)].slice(0, 8);
    setRecent(next);
    save(RECENT_KEY, next);
    onPick(name);
    onClose();
  };

  const renderItem = (name, icon) => {
    const preset = presetByName(name);
    return (
      <button
        key={name}
        type="button"
        onClick={() => pick(name)}
        className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 active:scale-[0.99] transition"
      >
        {icon}
        <span className="text-sm font-semibold text-slate-700 flex-1">{name}</span>
        <span className="text-[10px] uppercase tracking-wide text-slate-400">{preset.kind}</span>
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Obstacle / Deduction</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search obstacles…" className="pl-9 h-11" />
        </div>

        {!q && fav.length > 0 && (
          <Section title="Favorites">
            {fav.map((n) => renderItem(n, <Star size={14} className="text-amber-500 fill-amber-400" />))}
          </Section>
        )}
        {!q && recent.length > 0 && (
          <Section title="Recently Used">
            {recent.map((n) => renderItem(n, <Star size={14} className="text-slate-300" />))}
          </Section>
        )}

        {filtered.map((c) => (
          <Section key={c.category} title={c.category}>
            {c.items.map((it) =>
              renderItem(it.name, <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />)
            )}
          </Section>
        ))}
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }) {
  return (
    <div className="mt-4">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">{title}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">{children}</div>
    </div>
  );
}
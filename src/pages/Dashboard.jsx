import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Square,
  Circle as CircleIcon,
  Sprout,
  Car,
  Footprints,
  Shovel,
  Box,
  Grid3x3,
  Crop,
  Ban,
  LayoutGrid,
  FolderOpen,
  BookOpen,
  GraduationCap,
  Package,
  Sparkles,
  Eye,
  ChevronRight,
} from "lucide-react";

// Large visual categories. "guided" = has the new Guided Measurement flow;
// otherwise routes to the existing calculator (functionality preserved).
const CATEGORIES = [
  { label: "Patio or Rectangle", blurb: "Square or rectangular patios & slabs.", icon: Square, color: "bg-sky-700", path: "/calc/rectangle", guided: false },
  { label: "Walkway or Curved Path", blurb: "Straight, tapered or curved walkways.", icon: Footprints, color: "bg-cyan-700", path: "/calc/walkway", guided: false },
  { label: "Driveway", blurb: "Main slab, flares, apron & garage.", icon: Car, color: "bg-slate-700", path: "/calc/driveway", guided: false },
  { label: "Turf or Lawn", blurb: "Turf area with deductions & seams.", icon: Sprout, color: "bg-green-700", path: "/calc/turf", guided: false },
  { label: "Steps and Stairs", blurb: "Rise, run, bullnose & surface area.", icon: Shovel, color: "bg-amber-700", path: "/guided/steps", guided: true },
  { label: "Walls and Planters", blurb: "Face area, caps, ends & corners.", icon: Box, color: "bg-orange-700", path: "/guided/walls", guided: true },
  { label: "Borders and Edging", blurb: "Linear run, rows & inside edges.", icon: Grid3x3, color: "bg-rose-700", path: "/calc/border", guided: false },
  { label: "Circle or Fire Pit", blurb: "Diameter, ring & seating wall.", icon: CircleIcon, color: "bg-indigo-700", path: "/calc/circle", guided: false },
  { label: "Irregular Area", blurb: "Divide into simple shapes.", icon: Crop, color: "bg-teal-700", path: "/calc/irregular", guided: false },
  { label: "Obstacles and Deductions", blurb: "AC, trees, columns, drains & pads.", icon: Ban, color: "bg-fuchsia-700", path: "/calc/combined", guided: false },
  { label: "Complete Project", blurb: "Sections A, B, C + layout plan.", icon: LayoutGrid, color: "bg-emerald-800", path: "/builder", guided: false },
];

export default function Dashboard() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white px-5 py-6 shadow-lg">
        <div className="flex items-center gap-2">
          <Sparkles size={26} className="text-amber-300" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Paver Measure Pro</h1>
            <p className="text-xs text-emerald-100">Guided field measurement & estimating</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-6">
        {/* Primary actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate("/projects/new")} className="flex flex-col items-center justify-center gap-2 bg-amber-500 text-white rounded-2xl py-6 shadow-md active:scale-95 transition">
            <Plus size={32} />
            <span className="font-bold text-base">New Project</span>
          </button>
          <button onClick={() => navigate("/projects")} className="flex flex-col items-center justify-center gap-2 bg-emerald-700 text-white rounded-2xl py-6 shadow-md active:scale-95 transition">
            <FolderOpen size={32} />
            <span className="font-bold text-base">Saved Projects</span>
          </button>
        </div>

        {/* Categories */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3 px-1">What are you measuring?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex gap-3">
                  <div className={`w-14 h-14 shrink-0 rounded-xl flex items-center justify-center ${c.color}`}>
                    <Icon size={26} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm leading-tight">{c.label}</span>
                      {c.guided && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded">GUIDED</span>}
                    </div>
                    <p className="text-xs text-slate-500 mb-2 leading-snug">{c.blurb}</p>
                    <div className="flex gap-2">
                      <button onClick={() => navigate(c.path)} className="flex items-center gap-1 bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg active:scale-95">
                        Start Measuring <ChevronRight size={14} />
                      </button>
                      <button onClick={() => navigate("/how-to")} className="flex items-center gap-1 border border-slate-300 text-slate-600 text-xs font-bold px-3 py-2 rounded-lg active:scale-95">
                        <Eye size={14} /> View Example
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reference & resources */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button onClick={() => navigate("/how-to")} className="flex items-center gap-3 bg-amber-600 text-white rounded-2xl py-3.5 px-4 shadow-sm active:scale-95">
            <GraduationCap size={22} />
            <div className="text-left"><div className="font-bold text-sm">How To Measure</div><div className="text-xs text-amber-100">Visual training</div></div>
          </button>
          <button onClick={() => navigate("/guide")} className="flex items-center gap-3 bg-slate-800 text-white rounded-2xl py-3.5 px-4 shadow-sm active:scale-95">
            <BookOpen size={22} />
            <div className="text-left"><div className="font-bold text-sm">Formula Guide</div><div className="text-xs text-slate-300">Reference diagrams</div></div>
          </button>
          <button onClick={() => navigate("/products")} className="flex items-center gap-3 bg-violet-700 text-white rounded-2xl py-3.5 px-4 shadow-sm active:scale-95">
            <Package size={22} />
            <div className="text-left"><div className="font-bold text-sm">Product Library</div><div className="text-xs text-violet-100">Material data</div></div>
          </button>
        </div>
      </div>
    </div>
  );
}
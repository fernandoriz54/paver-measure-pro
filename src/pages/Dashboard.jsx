import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Square,
  Circle as CircleIcon,
  Triangle,
  Layers,
  Sprout,
  Car,
  Footprints,
  Trees,
  Crop,
  Package,
  FolderOpen,
  BookOpen,
  Ruler,
  Sparkles,
  Shovel,
  Grid3x3,
  LayoutGrid,
  GraduationCap,
} from "lucide-react";

const CALC_BUTTONS = [
  { label: "Rectangle & Square", path: "/calc/rectangle", icon: Square, color: "bg-sky-700" },
  { label: "Circle & Curved", path: "/calc/circle", icon: CircleIcon, color: "bg-indigo-700" },
  { label: "Triangle", path: "/calc/triangle", icon: Triangle, color: "bg-teal-700" },
  { label: "Paver Calculator", path: "/calc/paver", icon: Layers, color: "bg-emerald-700" },
  { label: "Turf Calculator", path: "/calc/turf", icon: Sprout, color: "bg-green-700" },
  { label: "Driveway", path: "/calc/driveway", icon: Car, color: "bg-slate-700" },
  { label: "Walkway & Patio", path: "/calc/walkway", icon: Footprints, color: "bg-cyan-700" },
  { label: "Lawn", path: "/calc/lawn", icon: Trees, color: "bg-lime-700" },
  { label: "Steps & Stairs", path: "/calc/steps", icon: Shovel, color: "bg-amber-700" },
  { label: "Border & Edging", path: "/calc/border", icon: Grid3x3, color: "bg-orange-700" },
  { label: "Irregular Area", path: "/calc/irregular", icon: Crop, color: "bg-rose-700" },
  { label: "Material Quantity", path: "/calc/material", icon: Package, color: "bg-violet-700" },
  { label: "Unit Converter", path: "/calc/converter", icon: Ruler, color: "bg-fuchsia-700" },
  { label: "Combined + Deduct", path: "/calc/combined", icon: Plus, color: "bg-emerald-900" },
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
            <p className="text-xs text-emerald-100">Field Measurement & Estimating Assistant</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 space-y-6">
        {/* Primary actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/projects/new")}
            className="flex flex-col items-center justify-center gap-2 bg-amber-500 text-white rounded-2xl py-6 shadow-md active:scale-95 transition"
          >
            <Plus size={32} />
            <span className="font-bold text-base">New Project</span>
          </button>
          <button
            onClick={() => navigate("/projects")}
            className="flex flex-col items-center justify-center gap-2 bg-emerald-700 text-white rounded-2xl py-6 shadow-md active:scale-95 transition"
          >
            <FolderOpen size={32} />
            <span className="font-bold text-base">Saved Projects</span>
          </button>
        </div>

        {/* Built-in estimate builder */}
        <button
          onClick={() => navigate("/builder")}
          className="w-full flex items-center gap-3 bg-gradient-to-r from-emerald-700 to-emerald-900 text-white rounded-2xl py-4 px-5 shadow-md active:scale-95 transition"
        >
          <LayoutGrid size={26} />
          <div className="text-left flex-1">
            <div className="font-bold text-base">Estimate Builder</div>
            <div className="text-xs text-emerald-100">Sections A, B, C… + layout plan, auto-calculated</div>
          </div>
          <Plus size={20} className="text-emerald-200" />
        </button>

        {/* Calculators */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3 px-1">Calculators</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CALC_BUTTONS.map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.path}
                  onClick={() => navigate(btn.path)}
                  className="flex flex-col items-center justify-center gap-2 bg-white rounded-2xl py-5 shadow-sm border border-slate-200 active:scale-95 hover:shadow-md transition"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${btn.color}`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 text-center px-1 leading-tight">{btn.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Training & guides */}
        <button
          onClick={() => navigate("/how-to")}
          className="w-full flex items-center gap-3 bg-amber-600 text-white rounded-2xl py-4 px-5 shadow-md active:scale-95 transition"
        >
          <GraduationCap size={24} />
          <div className="text-left flex-1">
            <div className="font-bold text-base">How To Measure</div>
            <div className="text-xs text-amber-100">Visual training: irregular areas, paths, curves</div>
          </div>
        </button>

        <button
          onClick={() => navigate("/guide")}
          className="w-full flex items-center gap-3 bg-slate-800 text-white rounded-2xl py-4 px-5 shadow-md active:scale-95 transition"
        >
          <BookOpen size={24} />
          <div className="text-left flex-1">
            <div className="font-bold text-base">Measurement Guide</div>
            <div className="text-xs text-slate-300">Formulas & reference diagrams</div>
          </div>
        </button>

        <button
          onClick={() => navigate("/products")}
          className="w-full flex items-center gap-3 bg-violet-700 text-white rounded-2xl py-4 px-5 shadow-md active:scale-95 transition"
        >
          <Package size={24} />
          <div className="text-left flex-1">
            <div className="font-bold text-base">Product Library</div>
            <div className="text-xs text-violet-100">Save products for material calculations</div>
          </div>
        </button>
      </div>
    </div>
  );
}
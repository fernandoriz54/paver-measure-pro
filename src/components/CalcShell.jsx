import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

// Shared shell for calculator pages: back button, title, subtitle.
export default function CalcShell({ title, subtitle, icon: Icon, children }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="sticky top-0 z-20 bg-emerald-800 text-white px-4 py-3 flex items-center gap-3 shadow-md">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/projects"))}
          className="p-2 -ml-2 rounded-lg hover:bg-emerald-700 transition"
          aria-label="Back"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-2 flex-1">
          {Icon && <Icon size={22} />}
          <div>
            <h1 className="text-lg font-bold leading-tight">{title}</h1>
            {subtitle && <p className="text-xs text-emerald-100 leading-tight">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">{children}</div>
    </div>
  );
}
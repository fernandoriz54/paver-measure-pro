import React from "react";
import { useLocation } from "react-router-dom";
import { Calculator, X } from "lucide-react";
import { useConverter } from "@/lib/ConverterContext";
import UnitConverterPanel from "./UnitConverterPanel";

const HIDDEN = ["/login", "/register", "/forgot-password", "/reset-password"];

export default function FloatingConverter() {
  const { open, setOpen } = useConverter();
  const loc = useLocation();
  if (HIDDEN.some((p) => loc.pathname.startsWith(p))) return null;

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-40 no-print h-14 w-14 rounded-full bg-emerald-700 text-white shadow-lg flex items-center justify-center active:scale-95 transition"
        aria-label="Open unit converter"
      >
        <Calculator size={26} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 no-print flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative w-full sm:w-96 max-w-full bg-white h-full sm:h-auto sm:mt-5 sm:mr-5 sm:max-h-[90vh] sm:rounded-2xl shadow-2xl overflow-auto">
            <div className="sticky top-0 bg-emerald-800 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <Calculator size={18} /> Unit Converter
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-emerald-700" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <UnitConverterPanel onUse={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
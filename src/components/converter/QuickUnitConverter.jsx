import React, { useState } from "react";
import { Ruler } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import UnitConverterPanel from "./UnitConverterPanel";

// Compact, inline unit converter that sits beside a measurement field.
// onInsert(value) receives the converted numeric (decimal feet) and the
// parent drops it into the active field. Does NOT navigate or clear data.
export default function QuickUnitConverter({ onInsert }) {
  const [open, setOpen] = useState(false);

  const handleInsert = (val) => {
    if (onInsert) onInsert(val);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-1.5 py-1 hover:bg-emerald-100 active:scale-95 transition"
          aria-label="Convert units"
        >
          <Ruler size={12} /> Convert
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="end">
        <UnitConverterPanel
          insertValue={handleInsert}
          onUse={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
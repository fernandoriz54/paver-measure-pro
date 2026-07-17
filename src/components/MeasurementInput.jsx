import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { feetInchesToDecimal } from "@/lib/measurementUtils";
import QuickUnitConverter from "@/components/converter/QuickUnitConverter";

// Feet + Inches input with auto-conversion to decimal feet.
// props: label, onChange(decimalValue), value (decimal), allowDecimal (default true)
export default function MeasurementInput({ label, onChange, value, hint, defaultMode = "fi" }) {
  const [feet, setFeet] = useState("");
  const [inches, setInches] = useState("");
  const [decimal, setDecimal] = useState("");
  const [mode, setMode] = useState(defaultMode); // "fi" = feet+inches, "dec" = decimal feet

  // When value changes externally, sync (decimal mode)
  useEffect(() => {
    if (value !== undefined && value !== null && mode === "dec") {
      setDecimal(String(value));
    }
  }, [value, mode]);

  const handleFiChange = (f, i) => {
    const dec = feetInchesToDecimal(f, i);
    onChange(dec);
  };

  const handleDecimalChange = (d) => {
    setDecimal(d);
    onChange(parseFloat(d) || 0);
  };

  // Insert a converted decimal-feet value from the inline converter.
  const handleInsert = (v) => {
    const dec = parseFloat(v) || 0;
    setMode("dec");
    setDecimal(String(dec));
    onChange(dec);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        {label ? <Label className="text-base font-semibold">{label}</Label> : <span />}
        <QuickUnitConverter onInsert={handleInsert} />
      </div>
      <div className="flex gap-1.5 mb-1.5">
        <button
          type="button"
          onClick={() => setMode("fi")}
          className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition ${
            mode === "fi" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          Feet + Inches
        </button>
        <button
          type="button"
          onClick={() => setMode("dec")}
          className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition ${
            mode === "dec" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          Decimal Feet
        </button>
      </div>
      {mode === "fi" ? (
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="number"
              inputMode="decimal"
              placeholder="Feet"
              value={feet}
              onChange={(e) => {
                setFeet(e.target.value);
                handleFiChange(e.target.value, inches);
              }}
              className="text-lg h-14"
            />
            <span className="text-xs text-slate-400">ft</span>
          </div>
          <div className="flex-1">
            <Input
              type="number"
              inputMode="decimal"
              placeholder="Inches"
              value={inches}
              onChange={(e) => {
                setInches(e.target.value);
                handleFiChange(feet, e.target.value);
              }}
              className="text-lg h-14"
            />
            <span className="text-xs text-slate-400">in</span>
          </div>
        </div>
      ) : (
        <div>
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="0.00"
            value={decimal}
            onChange={(e) => handleDecimalChange(e.target.value)}
            className="text-lg h-14"
          />
          <span className="text-xs text-slate-400">decimal feet</span>
        </div>
      )}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
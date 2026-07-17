import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONVERSIONS, parseMeasurement, parseNumber } from "@/lib/unitConverter";
import { useConverter } from "@/lib/ConverterContext";

export default function UnitConverterPanel({ onUse, insertValue }) {
  const ctx = useConverter();
  const insert = ctx ? ctx.insert : null;
  const [catId, setCatId] = useState("ftin_to_decimal");
  const [input, setInput] = useState("");
  const [width, setWidth] = useState("");
  const [factor, setFactor] = useState("");

  const cat = CONVERSIONS.find((c) => c.id === catId);

  const result = useMemo(() => {
    if (!cat) return null;
    if (cat.mixed) {
      const parsed = parseMeasurement(input);
      if (!parsed.ok) return null;
      return cat.run(parsed, parseMeasurement(width).feet, parsed, factor ? parseFloat(factor) : 1);
    }
    const n = parseNumber(input);
    if (n === null) return null;
    return cat.run(n, parseMeasurement(width).feet, null, factor ? parseFloat(factor) : 1);
  }, [cat, input, width, factor]);

  const handleUse = () => {
    if (!result) return;
    const val = result.insert ?? result.value;
    if (insertValue) insertValue(val);
    else if (insert) insert(val);
    if (onUse) onUse();
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-slate-500">Conversion type</Label>
        <Select value={catId} onValueChange={setCatId}>
          <SelectTrigger className="h-11 text-base mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CONVERSIONS.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs text-slate-500">
          {cat?.mixed ? "Measurement (e.g. 8' 6\", 8 feet 6 inches, 102 in)" : "Value"}
        </Label>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          inputMode="decimal"
          placeholder={cat?.mixed ? "8' 6\"" : "0"}
          className="h-11 text-base mt-1"
        />
      </div>

      {cat?.needsWidth && (
        <div>
          <Label className="text-xs text-slate-500">Width (e.g. 6 in, 0.5 ft)</Label>
          <Input
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            inputMode="decimal"
            placeholder="6 in"
            className="h-11 text-base mt-1"
          />
        </div>
      )}

      {cat?.custom && (
        <div>
          <Label className="text-xs text-slate-500">Multiply by (factor)</Label>
          <Input
            value={factor}
            onChange={(e) => setFactor(e.target.value)}
            inputMode="decimal"
            placeholder="1"
            className="h-11 text-base mt-1"
          />
        </div>
      )}

      {result?.warning && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-2.5 text-sm text-amber-800">
          {result.warning}
        </div>
      )}

      {result && !result.warning && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Result</div>
          <div className="text-2xl font-bold text-slate-900 mt-0.5">
            {result.value}
            {result.unit && <span className="text-base font-medium text-slate-400 ml-1">{result.unit}</span>}
          </div>
          {result.formula && (
            <div className="mt-1.5 text-xs text-slate-600 bg-white rounded-md px-2 py-1.5 font-mono">{result.formula}</div>
          )}
        </div>
      )}

      <Button onClick={handleUse} disabled={!result || !!result.warning} className="w-full h-11 text-base">
        Use This Measurement
      </Button>
      <p className="text-xs text-slate-400 text-center">Tap a measurement field first, then convert & insert — your entries stay intact.</p>
    </div>
  );
}
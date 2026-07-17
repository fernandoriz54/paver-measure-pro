import React, { useState } from "react";
import { Triangle } from "lucide-react";
import CalcShell from "@/components/CalcShell";
import MeasurementInput from "@/components/MeasurementInput";
import { ResultCard, FormulaBreakdown, WarningList } from "@/components/ResultCard";
import { calcTriangle, calcTriangleSides, validateMeasurements, formatValue } from "@/lib/measurementUtils";
import { Label } from "@/components/ui/label";

export default function TriangleCalc() {
  const [mode, setMode] = useState("baseHeight"); // baseHeight | threeSides
  const [base, setBase] = useState(0);
  const [height, setHeight] = useState(0);
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  const [precision] = useState("hundredth");

  let result, formula;
  if (mode === "baseHeight") {
    result = calcTriangle(base, height);
    formula = `${formatValue(base, precision)} × ${formatValue(height, precision)} ÷ 2 = ${formatValue(result.area, precision)}`;
  } else {
    result = calcTriangleSides(a, b, c);
    formula = `Heron's formula: s = (${a}+${b}+${c})/2 → Area = ${formatValue(result.area, precision)}`;
  }

  const warnings = validateMeasurements({}, "triangle");

  return (
    <CalcShell title="Triangle" subtitle="Area = Base × Height ÷ 2" icon={Triangle}>
      <div className="space-y-4">
        <div className="flex gap-1.5">
          <button
            onClick={() => setMode("baseHeight")}
            className={`flex-1 text-sm font-semibold py-2.5 rounded-lg ${mode === "baseHeight" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            Base & Height
          </button>
          <button
            onClick={() => setMode("threeSides")}
            className={`flex-1 text-sm font-semibold py-2.5 rounded-lg ${mode === "threeSides" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            Three Sides
          </button>
        </div>

        {mode === "baseHeight" ? (
          <>
            <MeasurementInput label="Base" onChange={setBase} />
            <MeasurementInput label="Height" onChange={setHeight} />
          </>
        ) : (
          <>
            <MeasurementInput label="Side A" onChange={setA} />
            <MeasurementInput label="Side B" onChange={setB} />
            <MeasurementInput label="Side C" onChange={setC} />
          </>
        )}

        <WarningList warnings={warnings} />

        <ResultCard
          title="Area"
          value={formatValue(result.area, precision)}
          unit="sq ft"
          formula={formula}
        />
        {mode === "threeSides" && (
          <ResultCard
            title="Perimeter"
            value={formatValue(result.perimeter, precision)}
            unit="lin ft"
            formula={`${a} + ${b} + ${c} = ${formatValue(result.perimeter, precision)}`}
          />
        )}

        <FormulaBreakdown
          steps={
            mode === "baseHeight"
              ? [
                  `Base: ${formatValue(base, precision)} ft`,
                  `Height: ${formatValue(height, precision)} ft`,
                  `Area = ${formatValue(base, precision)} × ${formatValue(height, precision)} ÷ 2 = ${formatValue(result.area, precision)} sq ft`,
                ]
              : [
                  `Sides: ${a}, ${b}, ${c} ft`,
                  `s = (${a} + ${b} + ${c}) ÷ 2`,
                  `Area = √(s × (s−a) × (s−b) × (s−c)) = ${formatValue(result.area, precision)} sq ft`,
                  `Perimeter = ${a} + ${b} + ${c} = ${formatValue(result.perimeter, precision)} lin ft`,
                ]
          }
        />
      </div>
    </CalcShell>
  );
}
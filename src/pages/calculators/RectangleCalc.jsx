import React, { useState } from "react";
import { Square } from "lucide-react";
import CalcShell from "@/components/CalcShell";
import MeasurementInput from "@/components/MeasurementInput";
import { ResultCard, FormulaBreakdown, WarningList } from "@/components/ResultCard";
import { calcRectangle, applyWaste, validateMeasurements, formatValue } from "@/lib/measurementUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function RectangleCalc() {
  const [length, setLength] = useState(0);
  const [width, setWidth] = useState(0);
  const [waste, setWaste] = useState(5);
  const [precision, setPrecision] = useState("hundredth");

  const result = calcRectangle(length, width);
  const wasteResult = applyWaste(result.area, waste);
  const warnings = validateMeasurements({ wastePercent: waste }, "rectangle");

  return (
    <CalcShell title="Rectangle & Square" subtitle="Area = Length × Width" icon={Square}>
      <div className="space-y-4">
        <MeasurementInput label="Length" onChange={setLength} hint="e.g. 46 ft 3 in" />
        <MeasurementInput label="Width" onChange={setWidth} hint="e.g. 5 ft" />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-base font-semibold">Waste %</Label>
            <Select value={String(waste)} onValueChange={(v) => setWaste(Number(v))}>
              <SelectTrigger className="h-12 text-base mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[5, 7, 10, 12, 15].map((w) => (
                  <SelectItem key={w} value={String(w)}>{w}%</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-base font-semibold">Rounding</Label>
            <Select value={precision} onValueChange={setPrecision}>
              <SelectTrigger className="h-12 text-base mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="exact">Exact</SelectItem>
                <SelectItem value="hundredth">Nearest hundredth</SelectItem>
                <SelectItem value="tenth">Nearest tenth</SelectItem>
                <SelectItem value="whole">Whole sq ft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <WarningList warnings={warnings} />

        <div className="grid grid-cols-1 gap-3">
          <ResultCard
            title="Square Footage"
            value={formatValue(result.area, precision)}
            unit="sq ft"
            formula={`${formatValue(length, precision)} × ${formatValue(width, precision)} = ${formatValue(result.area, precision)}`}
          />
          <ResultCard
            title="Perimeter / Linear Footage"
            value={formatValue(result.perimeter, precision)}
            unit="lin ft"
            formula={`2 × (${formatValue(length, precision)} + ${formatValue(width, precision)}) = ${formatValue(result.perimeter, precision)}`}
          />
          <ResultCard
            title="Waste Amount"
            value={formatValue(wasteResult.wasteAmount, precision)}
            unit="sq ft"
            formula={`${formatValue(result.area, precision)} × ${waste}% = ${formatValue(wasteResult.wasteAmount, precision)}`}
          />
          <ResultCard
            title="Total Material (with waste)"
            value={formatValue(wasteResult.total, precision)}
            unit="sq ft"
            formula={`${formatValue(result.area, precision)} + ${formatValue(wasteResult.wasteAmount, precision)} = ${formatValue(wasteResult.total, precision)}`}
          />
        </div>

        <FormulaBreakdown
          steps={[
            `Length: ${formatValue(length, precision)} ft`,
            `Width: ${formatValue(width, precision)} ft`,
            `Area = ${formatValue(length, precision)} × ${formatValue(width, precision)} = ${formatValue(result.area, precision)} sq ft`,
            `Perimeter = 2 × (${formatValue(length, precision)} + ${formatValue(width, precision)}) = ${formatValue(result.perimeter, precision)} lin ft`,
            `Waste = ${formatValue(result.area, precision)} × ${waste}% = ${formatValue(wasteResult.wasteAmount, precision)} sq ft`,
            `Total = ${formatValue(result.area, precision)} + ${formatValue(wasteResult.wasteAmount, precision)} = ${formatValue(wasteResult.total, precision)} sq ft`,
          ]}
        />
      </div>
    </CalcShell>
  );
}
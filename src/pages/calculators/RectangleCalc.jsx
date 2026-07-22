import React, { useState } from "react";
import { Square } from "lucide-react";
import CalcShell from "@/components/CalcShell";
import MeasurementInput from "@/components/MeasurementInput";
import { ResultCard, FormulaBreakdown, WarningList } from "@/components/ResultCard";
import { calcRectangle, applyWaste, validateMeasurements, formatValue } from "@/lib/measurementUtils";
import { activeDeductionArea } from "@/lib/deductionUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import ObstacleToolkit from "@/components/ObstacleToolkit";
import QuickMeasureBar from "@/components/quickmeasure/QuickMeasureBar";
import AdvancedDetails from "@/components/quickmeasure/AdvancedDetails";
import SaveToProject from "@/components/SaveToProject";

export default function RectangleCalc() {
  const [length, setLength] = useState(0);
  const [width, setWidth] = useState(0);
  const [waste, setWaste] = useState(5);
  const [precision, setPrecision] = useState("hundredth");
  const [deductions, setDeductions] = useState([]);

  const result = calcRectangle(length, width);
  const activeDeduct = activeDeductionArea(deductions);
  const netArea = Math.max(0, result.area - activeDeduct);
  const wasteResult = applyWaste(netArea, waste);
  const warnings = validateMeasurements({ grossArea: result.area, deductions: activeDeduct, wastePercent: waste }, "rectangle");

  return (
    <CalcShell title="Rectangle & Square" subtitle="Area = Length × Width" icon={Square}>
      <div className="space-y-4">
        <QuickMeasureBar helpId="rectangle" guidedId="patios" />
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
            title="Active Deductions"
            value={formatValue(activeDeduct, precision)}
            unit="sq ft"
            formula={`${formatValue(result.area, precision)} − ${formatValue(activeDeduct, precision)} = ${formatValue(netArea, precision)}`}
          />
          <ResultCard title="Net Area" value={formatValue(netArea, precision)} unit="sq ft" />
          <ResultCard
            title="Waste Amount"
            value={formatValue(wasteResult.wasteAmount, precision)}
            unit="sq ft"
            formula={`${formatValue(netArea, precision)} × ${waste}% = ${formatValue(wasteResult.wasteAmount, precision)}`}
          />
          <ResultCard
            title="Total Material (with waste)"
            value={formatValue(wasteResult.total, precision)}
            unit="sq ft"
            formula={`${formatValue(netArea, precision)} + ${formatValue(wasteResult.wasteAmount, precision)} = ${formatValue(wasteResult.total, precision)}`}
          />
        </div>

        <SaveToProject sections={[{ label: "Rectangle", type: "rectangle", params: { length, width }, deductions, gross: result.area, totalDeduct: activeDeduct, net: netArea }]} />

        <AdvancedDetails title="Deductions, Obstacles & Formula" summary="Add deductions and view the full calculation breakdown.">
          <ObstacleToolkit
            grossArea={result.area}
            sections={[{ id: "rect", type: "rectangle", label: "Rectangle", params: { length, width } }]}
            deductions={deductions}
            setDeductions={setDeductions}
          />
          <FormulaBreakdown
            steps={[
              `Length: ${formatValue(length, precision)} ft`,
              `Width: ${formatValue(width, precision)} ft`,
              `Gross area = ${formatValue(length, precision)} × ${formatValue(width, precision)} = ${formatValue(result.area, precision)} sq ft`,
              `Perimeter = 2 × (${formatValue(length, precision)} + ${formatValue(width, precision)}) = ${formatValue(result.perimeter, precision)} lin ft`,
              `Active deductions = ${formatValue(activeDeduct, precision)} sq ft`,
              `Net area = ${formatValue(result.area, precision)} − ${formatValue(activeDeduct, precision)} = ${formatValue(netArea, precision)} sq ft`,
              `Waste = ${formatValue(netArea, precision)} × ${waste}% = ${formatValue(wasteResult.wasteAmount, precision)} sq ft`,
              `Final = ${formatValue(netArea, precision)} + ${formatValue(wasteResult.wasteAmount, precision)} = ${formatValue(wasteResult.total, precision)} sq ft`,
            ]}
          />
        </AdvancedDetails>
      </div>
    </CalcShell>
  );
}
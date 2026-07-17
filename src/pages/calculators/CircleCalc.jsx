import React, { useState } from "react";
import { Circle as CircleIcon } from "lucide-react";
import CalcShell from "@/components/CalcShell";
import MeasurementInput from "@/components/MeasurementInput";
import { ResultCard, FormulaBreakdown, WarningList } from "@/components/ResultCard";
import {
  calcCircleFromDiameter,
  calcCircleFromRadius,
  calcCircleFromCircumference,
  validateMeasurements,
  formatValue,
  PI,
} from "@/lib/measurementUtils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ObstacleToolkit from "@/components/ObstacleToolkit";

export default function CircleCalc() {
  const [mode, setMode] = useState("diameter"); // diameter | radius | circumference
  const [diameter, setDiameter] = useState(11);
  const [radius, setRadius] = useState(0);
  const [circumference, setCircumference] = useState(0);
  const [percent, setPercent] = useState(100);
  const [precision, setPrecision] = useState("hundredth");
  const [deductions, setDeductions] = useState([]);

  let result;
  if (mode === "diameter") result = calcCircleFromDiameter(parseFloat(diameter) || 0);
  else if (mode === "radius") result = calcCircleFromRadius(parseFloat(radius) || 0);
  else result = calcCircleFromCircumference(parseFloat(circumference) || 0);

  const isPartial = percent !== 100;
  const partialArea = (result.area * percent) / 100;
  const warnings = validateMeasurements(
    mode === "diameter" ? { diameter } : mode === "radius" ? { radius } : { circumference },
    "circle"
  );

  return (
    <CalcShell title="Circle & Curved Area" subtitle="Area = π × Radius²" icon={CircleIcon}>
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">I know the…</Label>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="h-12 text-base mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="diameter">Diameter</SelectItem>
              <SelectItem value="radius">Radius</SelectItem>
              <SelectItem value="circumference">Circumference</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {mode === "diameter" && (
          <div>
            <Label className="text-base font-semibold">Diameter (feet)</Label>
            <Input
              type="number"
              value={diameter}
              onChange={(e) => setDiameter(e.target.value)}
              className="text-lg h-14 mt-1"
            />
          </div>
        )}
        {mode === "radius" && (
          <div>
            <Label className="text-base font-semibold">Radius (feet)</Label>
            <Input
              type="number"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="text-lg h-14 mt-1"
            />
          </div>
        )}
        {mode === "circumference" && (
          <div>
            <Label className="text-base font-semibold">Circumference (feet)</Label>
            <Input
              type="number"
              value={circumference}
              onChange={(e) => setCircumference(e.target.value)}
              className="text-lg h-14 mt-1"
            />
          </div>
        )}

        <div>
          <Label className="text-base font-semibold">Portion of circle: {percent}%</Label>
          <Select value={String(percent)} onValueChange={(v) => setPercent(Number(v))}>
            <SelectTrigger className="h-12 text-base mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="100">Full circle (100%)</SelectItem>
              <SelectItem value="50">Half circle (50%)</SelectItem>
              <SelectItem value="25">Quarter circle (25%)</SelectItem>
              <SelectItem value="75">Three-quarter (75%)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
          <strong>Note:</strong> Diameter × 3.1416 gives the <em>circumference</em> (linear feet around the edge), not the area. Area uses π × Radius².
        </div>

        <WarningList warnings={warnings} />

        <div className="grid grid-cols-1 gap-3">
          <ResultCard
            title="Radius"
            value={formatValue(result.radius, precision)}
            unit="ft"
            formula={`${formatValue(result.diameter, precision)} ÷ 2 = ${formatValue(result.radius, precision)}`}
          />
          <ResultCard
            title="Diameter"
            value={formatValue(result.diameter, precision)}
            unit="ft"
            formula={`${formatValue(result.radius, precision)} × 2 = ${formatValue(result.diameter, precision)}`}
          />
          <ResultCard
            title="Circumference (linear)"
            value={formatValue(result.circumference, precision)}
            unit="lin ft"
            formula={`${formatValue(result.diameter, precision)} × ${PI} = ${formatValue(result.circumference, precision)}`}
          />
          <ResultCard
            title={isPartial ? `Area (${percent}%)` : "Area"}
            value={formatValue(partialArea, precision)}
            unit="sq ft"
            formula={
              isPartial
                ? `${PI} × ${formatValue(result.radius, precision)}² × ${percent}% = ${formatValue(partialArea, precision)}`
                : `${PI} × ${formatValue(result.radius, precision)}² = ${formatValue(partialArea, precision)}`
            }
          />
        </div>

        <ObstacleToolkit
          grossArea={partialArea}
          sections={[{ id: "circle", type: "circle", label: "Circle", params: { radius: result.radius } }]}
          deductions={deductions}
          setDeductions={setDeductions}
        />

        <FormulaBreakdown
          steps={[
            `Radius = Diameter ÷ 2 = ${formatValue(result.diameter, precision)} ÷ 2 = ${formatValue(result.radius, precision)} ft`,
            `Diameter = Radius × 2 = ${formatValue(result.radius, precision)} × 2 = ${formatValue(result.diameter, precision)} ft`,
            `Circumference = Diameter × ${PI} = ${formatValue(result.diameter, precision)} × ${PI} = ${formatValue(result.circumference, precision)} lin ft`,
            `Area = ${PI} × ${formatValue(result.radius, precision)}² = ${formatValue(result.area, precision)} sq ft`,
            isPartial ? `Partial area = ${formatValue(result.area, precision)} × ${percent}% = ${formatValue(partialArea, precision)} sq ft` : "",
          ].filter(Boolean)}
        />
      </div>
    </CalcShell>
  );
}
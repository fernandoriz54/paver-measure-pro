import React, { useState } from "react";
import { Sprout } from "lucide-react";
import CalcShell from "@/components/CalcShell";
import MeasurementInput from "@/components/MeasurementInput";
import { ResultCard, FormulaBreakdown, WarningList } from "@/components/ResultCard";
import { applyWaste, validateMeasurements, formatValue } from "@/lib/measurementUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import ObstacleToolkit from "@/components/ObstacleToolkit";
import { squareSection, activeDeductionArea } from "@/lib/deductionUtils";

export default function TurfCalc() {
  const [grossArea, setGrossArea] = useState(0);
  const [concreteArea, setConcreteArea] = useState(0);
  const [walkwayArea, setWalkwayArea] = useState(0);
  const [treeWellArea, setTreeWellArea] = useState(0);
  const [planterArea, setPlanterArea] = useState(0);
  const [paverBorderArea, setPaverBorderArea] = useState(0);
  const [otherDeductions, setOtherDeductions] = useState(0);
  const [waste, setWaste] = useState(10);
  const [rollWidth, setRollWidth] = useState(15);
  const [perimeter, setPerimeter] = useState(0);
  const [precision] = useState("hundredth");
  const [deductions, setDeductions] = useState([]);

  const totalDeductions = concreteArea + walkwayArea + treeWellArea + planterArea + paverBorderArea + otherDeductions;
  const activeDeduct = activeDeductionArea(deductions);
  const netTurf = Math.max(0, grossArea - totalDeductions - activeDeduct);
  const wasteResult = applyWaste(netTurf, waste);
  const totalTurf = wasteResult.total;

  // Roll layout estimate
  const rollLengths = rollWidth > 0 ? totalTurf / rollWidth : 0;
  const numSeams = Math.ceil(rollLengths / 15); // rough estimate based on 15ft segments

  const warnings = validateMeasurements({ grossArea, deductions: totalDeductions, wastePercent: waste }, "turf");
  if (numSeams > 8) warnings.push("Turf layout may create excessive seams — consider adjusting roll direction or width.");

  return (
    <CalcShell title="Turf Calculator" subtitle="Gross − deductions + waste = final quantity" icon={Sprout}>
      <div className="space-y-4">
        <MeasurementInput label="Gross Lawn Area" onChange={setGrossArea} />
        <MeasurementInput label="Existing Concrete Area" onChange={setConcreteArea} />
        <MeasurementInput label="Walkway Area" onChange={setWalkwayArea} />
        <MeasurementInput label="Tree-Well Area" onChange={setTreeWellArea} />
        <MeasurementInput label="Planter Area" onChange={setPlanterArea} />
        <MeasurementInput label="Paver Border Area" onChange={setPaverBorderArea} />
        <MeasurementInput label="Other Deducted Areas" onChange={setOtherDeductions} />

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
            <Label className="text-base font-semibold">Turf Roll Width</Label>
            <Select value={String(rollWidth)} onValueChange={(v) => setRollWidth(Number(v))}>
              <SelectTrigger className="h-12 text-base mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 ft</SelectItem>
                <SelectItem value="12">12 ft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-base font-semibold">Turf Perimeter (linear ft)</Label>
          <Input type="number" value={perimeter} onChange={(e) => setPerimeter(Number(e.target.value))} className="h-14 text-lg mt-1" />
        </div>

        <WarningList warnings={warnings} />

        <div className="grid grid-cols-1 gap-3">
          <ResultCard title="Gross Lawn Area" value={formatValue(grossArea, precision)} unit="sq ft" />
          <ResultCard title="Total Deductions" value={formatValue(totalDeductions, precision)} unit="sq ft"
            formula={`${formatValue(concreteArea, precision)} + ${formatValue(walkwayArea, precision)} + ${formatValue(treeWellArea, precision)} + ${formatValue(planterArea, precision)} + ${formatValue(paverBorderArea, precision)} + ${formatValue(otherDeductions, precision)} = ${formatValue(totalDeductions, precision)}`} />
          <ResultCard title="Net Turf Area" value={formatValue(netTurf, precision)} unit="sq ft"
            formula={`${formatValue(grossArea, precision)} − ${formatValue(totalDeductions, precision)} − ${formatValue(activeDeduct, precision)} = ${formatValue(netTurf, precision)}`} />
          <ResultCard title="Waste Amount" value={formatValue(wasteResult.wasteAmount, precision)} unit="sq ft"
            formula={`${formatValue(netTurf, precision)} × ${waste}% = ${formatValue(wasteResult.wasteAmount, precision)}`} />
          <ResultCard title="Final Turf Quantity" value={formatValue(totalTurf, precision)} unit="sq ft"
            formula={`${formatValue(netTurf, precision)} + ${formatValue(wasteResult.wasteAmount, precision)} = ${formatValue(totalTurf, precision)}`} />
          <ResultCard title="Edging / Perimeter Linear" value={formatValue(perimeter, precision)} unit="lin ft" />
          <ResultCard title="Est. Roll Lengths Needed" value={formatValue(rollLengths, precision)} unit={`lin ft @ ${rollWidth} ft wide`} />
          <ResultCard title="Approx. Number of Seams" value={numSeams} unit="seams" />
        </div>

        <ObstacleToolkit
          grossArea={grossArea}
          sections={[squareSection(grossArea, "Lawn")]}
          deductions={deductions}
          setDeductions={setDeductions}
        />

        <FormulaBreakdown
          steps={[
            `Gross = ${formatValue(grossArea, precision)} sq ft`,
            `Deductions = ${formatValue(totalDeductions, precision)} sq ft`,
            `Net = ${formatValue(grossArea, precision)} − ${formatValue(totalDeductions, precision)} − ${formatValue(activeDeduct, precision)} = ${formatValue(netTurf, precision)} sq ft`,
            `Waste = ${formatValue(netTurf, precision)} × ${waste}% = ${formatValue(wasteResult.wasteAmount, precision)} sq ft`,
            `Final = ${formatValue(netTurf, precision)} + ${formatValue(wasteResult.wasteAmount, precision)} = ${formatValue(totalTurf, precision)} sq ft`,
            `Roll lengths = ${formatValue(totalTurf, precision)} ÷ ${rollWidth} ft = ${formatValue(rollLengths, precision)} lin ft`,
          ]}
        />
      </div>
    </CalcShell>
  );
}
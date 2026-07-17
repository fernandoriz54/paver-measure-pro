import React, { useState } from "react";
import { Shovel } from "lucide-react";
import CalcShell from "@/components/CalcShell";
import MeasurementInput from "@/components/MeasurementInput";
import { ResultCard, FormulaBreakdown, WarningList } from "@/components/ResultCard";
import { calcSteps, applyWaste, validateMeasurements, formatValue } from "@/lib/measurementUtils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function StepsCalc() {
  const [numSteps, setNumSteps] = useState(3);
  const [totalHeight, setTotalHeight] = useState(24);
  const [stepWidth, setStepWidth] = useState(6);
  const [treadDepth, setTreadDepth] = useState(12);
  const [landingDepth, setLandingDepth] = useState(0);
  const [numLandings, setNumLandings] = useState(0);
  const [bullnosePieceLen, setBullnosePieceLen] = useState(0);
  const [waste, setWaste] = useState(10);
  const [precision] = useState("hundredth");

  const result = calcSteps({ numSteps, totalHeight: totalHeight / 12, stepWidth, treadDepth: treadDepth / 12, landingDepth: landingDepth / 12, numLandings });
  const bullnoseLinear = stepWidth * numSteps;
  const bullnosePieces = bullnosePieceLen > 0 ? Math.ceil(bullnoseLinear / (bullnosePieceLen / 12)) : 0;
  const sideEdgeLinear = (result.totalDepth) * 2;
  const stepWaste = applyWaste(result.totalStepArea, waste);

  const warnings = validateMeasurements({ totalHeight: totalHeight / 12, numSteps, wastePercent: waste }, "steps");

  return (
    <CalcShell title="Steps & Stairs" subtitle="Rise, run, bullnose & surface area" icon={Shovel}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-base font-semibold">Number of Steps</Label>
            <Input type="number" value={numSteps} onChange={(e) => setNumSteps(Number(e.target.value))} className="h-14 text-lg mt-1" />
          </div>
          <div>
            <Label className="text-base font-semibold">Total Height (in)</Label>
            <Input type="number" value={totalHeight} onChange={(e) => setTotalHeight(Number(e.target.value))} className="h-14 text-lg mt-1" />
          </div>
        </div>
        <MeasurementInput label="Step Width" onChange={setStepWidth} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-base font-semibold">Tread Depth (in)</Label>
            <Input type="number" value={treadDepth} onChange={(e) => setTreadDepth(Number(e.target.value))} className="h-14 text-lg mt-1" />
          </div>
          <div>
            <Label className="text-base font-semibold">Bullnose Piece Length (in)</Label>
            <Input type="number" value={bullnosePieceLen} onChange={(e) => setBullnosePieceLen(Number(e.target.value))} className="h-14 text-lg mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-base font-semibold">Landing Depth (in)</Label>
            <Input type="number" value={landingDepth} onChange={(e) => setLandingDepth(Number(e.target.value))} className="h-14 text-lg mt-1" />
          </div>
          <div>
            <Label className="text-base font-semibold">Number of Landings</Label>
            <Input type="number" value={numLandings} onChange={(e) => setNumLandings(Number(e.target.value))} className="h-14 text-lg mt-1" />
          </div>
        </div>
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

        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-800">
          <strong>Planning guidance only.</strong> Stair construction must comply with local building codes and final engineering approval. Typical residential riser: 6–8 inches.
        </div>

        <WarningList warnings={warnings} />

        <div className="grid grid-cols-1 gap-3">
          <ResultCard title="Recommended Rise Per Step" value={formatValue(result.risePerStep, precision)} unit="ft"
            formula={`${formatValue(totalHeight / 12, precision)} ÷ ${numSteps} = ${formatValue(result.risePerStep, precision)}`} />
          <ResultCard title="Total Run" value={formatValue(result.totalRun, precision)} unit="ft"
            formula={`${formatValue(treadDepth / 12, precision)} × ${numSteps} = ${formatValue(result.totalRun, precision)}`} />
          <ResultCard title="Total Stair Depth" value={formatValue(result.totalDepth, precision)} unit="ft"
            formula={`${formatValue(result.totalRun, precision)} + (${formatValue(landingDepth / 12, precision)} × ${numLandings}) = ${formatValue(result.totalDepth, precision)}`} />
          <ResultCard title="Step Surface Area" value={formatValue(result.stepSurfaceArea, precision)} unit="sq ft"
            formula={`${formatValue(treadDepth / 12, precision)} × ${stepWidth} × ${numSteps} = ${formatValue(result.stepSurfaceArea, precision)}`} />
          <ResultCard title="Riser Face Area" value={formatValue(result.riserFaceArea, precision)} unit="sq ft"
            formula={`${formatValue(result.risePerStep, precision)} × ${stepWidth} × ${numSteps} = ${formatValue(result.riserFaceArea, precision)}`} />
          <ResultCard title="Total Step Area" value={formatValue(result.totalStepArea, precision)} unit="sq ft" />
          <ResultCard title="Bullnose Linear Footage" value={formatValue(bullnoseLinear, precision)} unit="lin ft"
            formula={`${stepWidth} × ${numSteps} (exposed front edges) = ${formatValue(bullnoseLinear, precision)}`} />
          <ResultCard title="Side-Edge Linear" value={formatValue(sideEdgeLinear, precision)} unit="lin ft" />
          {bullnosePieceLen > 0 && (
            <ResultCard title="Bullnose Pieces Needed" value={bullnosePieces} unit="pieces"
              formula={`${formatValue(bullnoseLinear, precision)} ÷ ${formatValue(bullnosePieceLen / 12, precision)} → round up`} />
          )}
          <ResultCard title="Final Material (with waste)" value={formatValue(stepWaste.total, precision)} unit="sq ft"
            formula={`${formatValue(result.totalStepArea, precision)} + ${formatValue(stepWaste.wasteAmount, precision)} = ${formatValue(stepWaste.total, precision)}`} />
        </div>

        <FormulaBreakdown
          steps={[
            `Total rise = ${formatValue(totalHeight / 12, precision)} ft (${totalHeight} in)`,
            `Rise per step = ${formatValue(totalHeight / 12, precision)} ÷ ${numSteps} = ${formatValue(result.risePerStep, precision)} ft`,
            `Total run = ${formatValue(treadDepth / 12, precision)} × ${numSteps} = ${formatValue(result.totalRun, precision)} ft`,
            `Step surface = ${formatValue(treadDepth / 12, precision)} × ${stepWidth} × ${numSteps} = ${formatValue(result.stepSurfaceArea, precision)} sq ft`,
            `Bullnose = ${stepWidth} × ${numSteps} = ${formatValue(bullnoseLinear, precision)} lin ft`,
          ]}
        />
      </div>
    </CalcShell>
  );
}
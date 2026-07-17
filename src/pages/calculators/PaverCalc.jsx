import React, { useState } from "react";
import { Layers } from "lucide-react";
import CalcShell from "@/components/CalcShell";
import MeasurementInput from "@/components/MeasurementInput";
import { ResultCard, FormulaBreakdown, WarningList } from "@/components/ResultCard";
import { applyWaste, PRESET_PRODUCT_SIZES, PATTERN_WASTE_RECOMMEND, validateMeasurements, formatValue } from "@/lib/measurementUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function PaverCalc() {
  const [totalArea, setTotalArea] = useState(0);
  const [deductedArea, setDeductedArea] = useState(0);
  const [accentArea, setAccentArea] = useState(0);
  const [borderArea, setBorderArea] = useState(0);
  const [waste, setWaste] = useState(10);
  const [pattern, setPattern] = useState("straight");
  const [productPreset, setProductPreset] = useState("4 × 8");
  const [pieceLength, setPieceLength] = useState(8);
  const [pieceWidth, setPieceWidth] = useState(4);
  const [precision] = useState("hundredth");

  const netField = Math.max(0, totalArea - deductedArea - borderArea - accentArea);
  const fieldWaste = applyWaste(netField, waste);
  const borderWaste = applyWaste(borderArea, waste);
  const accentWaste = applyWaste(accentArea, waste);
  const totalPaver = fieldWaste.total + borderWaste.total + accentWaste.total;

  const sqftPerPiece = (pieceLength * pieceWidth) / 144;
  const fieldPieces = sqftPerPiece > 0 ? Math.ceil(fieldWaste.total / sqftPerPiece) : 0;
  const borderPieces = sqftPerPiece > 0 ? Math.ceil(borderWaste.total / sqftPerPiece) : 0;
  const accentPieces = sqftPerPiece > 0 ? Math.ceil(accentWaste.total / sqftPerPiece) : 0;

  const warnings = validateMeasurements({ grossArea: totalArea, deductions: deductedArea + borderArea + accentArea, wastePercent: waste }, "paver");

  const handlePreset = (label) => {
    setProductPreset(label);
    const preset = PRESET_PRODUCT_SIZES.find((p) => p.label === label);
    if (preset) {
      setPieceLength(preset.length_in);
      setPieceWidth(preset.width_in);
    }
  };

  return (
    <CalcShell title="Paver Calculator" subtitle="Field, border & accent areas with waste" icon={Layers}>
      <div className="space-y-4">
        <MeasurementInput label="Total Project Area" onChange={setTotalArea} />
        <MeasurementInput label="Deducted Areas (concrete, tree wells, etc.)" onChange={setDeductedArea} />
        <MeasurementInput label="Border Area (calculated separately)" onChange={setBorderArea} />
        <MeasurementInput label="Accent / Separate Product Area" onChange={setAccentArea} />

        <div>
          <Label className="text-base font-semibold">Installation Pattern</Label>
          <Select value={pattern} onValueChange={setPattern}>
            <SelectTrigger className="h-12 text-base mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="straight">Straight layout (5% waste)</SelectItem>
              <SelectItem value="running_bond">Running bond (7% waste)</SelectItem>
              <SelectItem value="combo">Combo pattern (10% waste)</SelectItem>
              <SelectItem value="diagonal">Diagonal pattern (12% waste)</SelectItem>
              <SelectItem value="curves">Curves / numerous cuts (15% waste)</SelectItem>
              <SelectItem value="irregular">Irregular edges (15% waste)</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="w-full mt-2 h-11"
            onClick={() => setWaste(PATTERN_WASTE_RECOMMEND[pattern])}
          >
            Apply recommended waste: {PATTERN_WASTE_RECOMMEND[pattern]}%
          </Button>
        </div>

        <div>
          <Label className="text-base font-semibold">Waste %</Label>
          <Select value={String(waste)} onValueChange={(v) => setWaste(Number(v))}>
            <SelectTrigger className="h-12 text-base mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[5, 7, 10, 12, 15, 20].map((w) => (
                <SelectItem key={w} value={String(w)}>{w}%</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-base font-semibold">Product Size</Label>
          <Select value={productPreset} onValueChange={handlePreset}>
            <SelectTrigger className="h-12 text-base mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRESET_PRODUCT_SIZES.map((p) => (
                <SelectItem key={p.label} value={p.label}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {productPreset !== "Three-piece combo" && productPreset !== "Custom" && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <Label className="text-xs">Piece Length (in)</Label>
                <Input type="number" value={pieceLength} onChange={(e) => setPieceLength(Number(e.target.value))} className="h-11 text-base mt-1" />
              </div>
              <div>
                <Label className="text-xs">Piece Width (in)</Label>
                <Input type="number" value={pieceWidth} onChange={(e) => setPieceWidth(Number(e.target.value))} className="h-11 text-base mt-1" />
              </div>
            </div>
          )}
        </div>

        <WarningList warnings={warnings} />

        <div className="grid grid-cols-1 gap-3">
          <ResultCard title="Net Paver Field" value={formatValue(netField, precision)} unit="sq ft"
            formula={`${formatValue(totalArea, precision)} − ${formatValue(deductedArea, precision)} − ${formatValue(borderArea, precision)} − ${formatValue(accentArea, precision)} = ${formatValue(netField, precision)}`} />
          <ResultCard title="Border Area" value={formatValue(borderArea, precision)} unit="sq ft" />
          <ResultCard title="Accent Area" value={formatValue(accentArea, precision)} unit="sq ft" />
          <ResultCard title="Total Paver Area (with waste)" value={formatValue(totalPaver, precision)} unit="sq ft"
            formula={`${formatValue(fieldWaste.total, precision)} + ${formatValue(borderWaste.total, precision)} + ${formatValue(accentWaste.total, precision)} = ${formatValue(totalPaver, precision)}`} />
          {sqftPerPiece > 0 && (
            <>
              <ResultCard title="Field Pavers Needed" value={fieldPieces} unit="pieces"
                formula={`${formatValue(fieldWaste.total, precision)} ÷ ${formatValue(sqftPerPiece, precision)} sq ft/piece → round up`} />
              <ResultCard title="Border Pavers Needed" value={borderPieces} unit="pieces" />
              <ResultCard title="Accent Pavers Needed" value={accentPieces} unit="pieces" />
              <ResultCard title="Total Pieces" value={fieldPieces + borderPieces + accentPieces} unit="pieces" />
            </>
          )}
        </div>

        <FormulaBreakdown
          steps={[
            `Net field = ${formatValue(totalArea, precision)} − ${formatValue(deductedArea, precision)} − ${formatValue(borderArea, precision)} − ${formatValue(accentArea, precision)} = ${formatValue(netField, precision)} sq ft`,
            `Field waste = ${formatValue(netField, precision)} × ${waste}% = ${formatValue(fieldWaste.wasteAmount, precision)} sq ft`,
            `Field total = ${formatValue(netField, precision)} + ${formatValue(fieldWaste.wasteAmount, precision)} = ${formatValue(fieldWaste.total, precision)} sq ft`,
            sqftPerPiece > 0 ? `Pieces per sq ft = 144 ÷ (${pieceLength} × ${pieceWidth}) = ${formatValue(1 / sqftPerPiece, precision)}` : "",
          ].filter(Boolean)}
        />
      </div>
    </CalcShell>
  );
}
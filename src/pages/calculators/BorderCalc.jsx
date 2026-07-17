import React, { useState } from "react";
import { Grid3x3 } from "lucide-react";
import CalcShell from "@/components/CalcShell";
import MeasurementInput from "@/components/MeasurementInput";
import { ResultCard, FormulaBreakdown, WarningList } from "@/components/ResultCard";
import { calcBorder, applyWaste, BORDER_WIDTH_OPTIONS, BORDER_STYLES, validateMeasurements, formatValue } from "@/lib/measurementUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function BorderCalc() {
  const [linearFeet, setLinearFeet] = useState(203.89);
  const [borderWidthIn, setBorderWidthIn] = useState(6);
  const [rows, setRows] = useState(1);
  const [style, setStyle] = useState("Soldier course");
  const [pieceLength, setPieceLength] = useState(0);
  const [waste, setWaste] = useState(10);
  const [precision] = useState("hundredth");

  const result = calcBorder(linearFeet, borderWidthIn, rows);
  const wasteResult = applyWaste(result.borderArea, waste);
  const widthFt = borderWidthIn / 12;
  const pieces = pieceLength > 0 ? Math.ceil(wasteResult.total / ((pieceLength / 12) * widthFt)) : 0;

  const warnings = validateMeasurements({ wastePercent: waste }, "border");

  return (
    <CalcShell title="Border & Edging" subtitle="Linear ft × border width = border area" icon={Grid3x3}>
      <div className="space-y-4">
        <MeasurementInput label="Total Perimeter / Linear Footage" onChange={setLinearFeet} />

        <div>
          <Label className="text-base font-semibold">Border Width</Label>
          <Select value={String(borderWidthIn)} onValueChange={(v) => setBorderWidthIn(Number(v))}>
            <SelectTrigger className="h-12 text-base mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {BORDER_WIDTH_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-base font-semibold">Border Rows</Label>
            <Input type="number" value={rows} onChange={(e) => setRows(Number(e.target.value))} className="h-14 text-lg mt-1" />
          </div>
          <div>
            <Label className="text-base font-semibold">Paver Piece Length (in)</Label>
            <Input type="number" value={pieceLength} onChange={(e) => setPieceLength(Number(e.target.value))} className="h-14 text-lg mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-base font-semibold">Border Style</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="h-12 text-base mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BORDER_STYLES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        </div>

        <WarningList warnings={warnings} />

        <div className="grid grid-cols-1 gap-3">
          <ResultCard title="Border Linear Footage" value={formatValue(linearFeet, precision)} unit="lin ft" />
          <ResultCard title="Border Width" value={formatValue(widthFt, precision)} unit="ft"
            formula={`${borderWidthIn} in ÷ 12 = ${formatValue(widthFt, precision)} ft`} />
          <ResultCard title="Border Square Footage" value={formatValue(result.borderArea, precision)} unit="sq ft"
            formula={`${formatValue(linearFeet, precision)} × ${formatValue(widthFt, precision)}${rows > 1 ? ` × ${rows} rows` : ""} = ${formatValue(result.borderArea, precision)}`} />
          <ResultCard title="Waste Amount" value={formatValue(wasteResult.wasteAmount, precision)} unit="sq ft" />
          <ResultCard title="Final Order Quantity" value={formatValue(wasteResult.total, precision)} unit="sq ft"
            formula={`${formatValue(result.borderArea, precision)} + ${formatValue(wasteResult.wasteAmount, precision)} = ${formatValue(wasteResult.total, precision)}`} />
          {pieceLength > 0 && (
            <ResultCard title="Approx. Pieces Needed" value={pieces} unit="pieces"
              formula={`${formatValue(wasteResult.total, precision)} ÷ (${formatValue(pieceLength / 12, precision)} × ${formatValue(widthFt, precision)}) → round up`} />
          )}
        </div>

        <FormulaBreakdown
          steps={[
            `Linear footage = ${formatValue(linearFeet, precision)} lin ft`,
            `Border width = ${borderWidthIn} in = ${formatValue(widthFt, precision)} ft`,
            `Border area = ${formatValue(linearFeet, precision)} × ${formatValue(widthFt, precision)}${rows > 1 ? ` × ${rows}` : ""} = ${formatValue(result.borderArea, precision)} sq ft`,
            `Waste = ${formatValue(result.borderArea, precision)} × ${waste}% = ${formatValue(wasteResult.wasteAmount, precision)} sq ft`,
            `Final = ${formatValue(result.borderArea, precision)} + ${formatValue(wasteResult.wasteAmount, precision)} = ${formatValue(wasteResult.total, precision)} sq ft`,
          ]}
        />
      </div>
    </CalcShell>
  );
}
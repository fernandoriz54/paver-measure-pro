import React, { useState } from "react";
import { Ruler } from "lucide-react";
import CalcShell from "@/components/CalcShell";
import { ResultCard, FormulaBreakdown } from "@/components/ResultCard";
import { feetInchesToDecimal, decimalToFeetInches, formatValue } from "@/lib/measurementUtils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function UnitConverter() {
  const [inches, setInches] = useState("");
  const [feet, setFeet] = useState("");
  const [feetFi, setFeetFi] = useState("");
  const [inchesFi, setInchesFi] = useState("");
  const [sqInches, setSqInches] = useState("");
  const [sqYards, setSqYards] = useState("");
  const [linearFeet, setLinearFeet] = useState("");
  const [widthIn, setWidthIn] = useState("");

  // Inches <-> Feet
  const inchesToFeet = inches ? (parseFloat(inches) / 12) : 0;
  const feetToInches = feet ? (parseFloat(feet) * 12) : 0;
  const fiToDecimal = feetInchesToDecimal(feetFi, inchesFi);
  const decToFi = feetFi || inchesFi ? decimalToFeetInches(fiToDecimal) : null;
  const sqInchesToSqFt = sqInches ? parseFloat(sqInches) / 144 : 0;
  const sqYardsToSqFt = sqYards ? parseFloat(sqYards) * 9 : 0;
  const lfWidth = widthIn ? (parseFloat(linearFeet) || 0) * (parseFloat(widthIn) / 12) : null;
  const sqFtFromLf = lfWidth !== null ? lfWidth : null;
  const lfFromSqFt = widthIn && linearFeet ? (parseFloat(linearFeet) / (parseFloat(widthIn) / 12)) : null;

  return (
    <CalcShell title="Unit Converter" subtitle="Feet, inches & area conversions" icon={Ruler}>
      <div className="space-y-5">
        {/* Inches to Feet */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
          <Label className="font-semibold">Inches → Feet</Label>
          <Input type="number" placeholder="Inches" value={inches} onChange={(e) => setInches(e.target.value)} className="h-12 text-base" />
          <ResultCard title="Feet" value={formatValue(inchesToFeet, "hundredth")} unit="ft" formula={`${inches} ÷ 12 = ${formatValue(inchesToFeet, "hundredth")}`} />
        </div>

        {/* Feet to Inches */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
          <Label className="font-semibold">Feet → Inches</Label>
          <Input type="number" placeholder="Feet" value={feet} onChange={(e) => setFeet(e.target.value)} className="h-12 text-base" />
          <ResultCard title="Inches" value={formatValue(feetToInches, "hundredth")} unit="in" formula={`${feet} × 12 = ${formatValue(feetToInches, "hundredth")}`} />
        </div>

        {/* Feet & Inches → Decimal */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
          <Label className="font-semibold">Feet + Inches → Decimal Feet</Label>
          <div className="flex gap-2">
            <Input type="number" placeholder="Feet" value={feetFi} onChange={(e) => setFeetFi(e.target.value)} className="h-12 text-base" />
            <Input type="number" placeholder="Inches" value={inchesFi} onChange={(e) => setInchesFi(e.target.value)} className="h-12 text-base" />
          </div>
          <ResultCard title="Decimal Feet" value={formatValue(fiToDecimal, "hundredth")} unit="ft"
            formula={`${feetFi || 0} + (${inchesFi || 0} ÷ 12) = ${formatValue(fiToDecimal, "hundredth")}`} />
          {decToFi && (
            <ResultCard title="Converted Back" value={`${decToFi.feet} ft ${decToFi.inches} in`} />
          )}
        </div>

        {/* Square Inches to Sq Ft */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
          <Label className="font-semibold">Square Inches → Square Feet</Label>
          <Input type="number" placeholder="Sq inches" value={sqInches} onChange={(e) => setSqInches(e.target.value)} className="h-12 text-base" />
          <ResultCard title="Square Feet" value={formatValue(sqInchesToSqFt, "hundredth")} unit="sq ft" formula={`${sqInches} ÷ 144 = ${formatValue(sqInchesToSqFt, "hundredth")}`} />
        </div>

        {/* Square Yards to Sq Ft */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
          <Label className="font-semibold">Square Yards → Square Feet</Label>
          <Input type="number" placeholder="Sq yards" value={sqYards} onChange={(e) => setSqYards(e.target.value)} className="h-12 text-base" />
          <ResultCard title="Square Feet" value={formatValue(sqYardsToSqFt, "hundredth")} unit="sq ft" formula={`${sqYards} × 9 = ${formatValue(sqYardsToSqFt, "hundredth")}`} />
        </div>

        {/* Linear Feet ↔ Square Feet */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
          <Label className="font-semibold">Linear Feet ↔ Square Feet (needs width)</Label>
          <div className="flex gap-2">
            <Input type="number" placeholder="Linear feet" value={linearFeet} onChange={(e) => setLinearFeet(e.target.value)} className="h-12 text-base" />
            <Input type="number" placeholder="Width (in)" value={widthIn} onChange={(e) => setWidthIn(e.target.value)} className="h-12 text-base" />
          </div>
          {widthIn ? (
            <>
              <ResultCard title="Square Feet" value={formatValue(sqFtFromLf, "hundredth")} unit="sq ft"
                formula={`${linearFeet} × (${widthIn} ÷ 12) = ${formatValue(sqFtFromLf, "hundredth")}`} />
            </>
          ) : (
            <p className="text-xs text-slate-400">Enter a width to convert linear feet to square feet.</p>
          )}
        </div>

        <FormulaBreakdown
          steps={[
            "Inches ÷ 12 = Feet",
            "Feet × 12 = Inches",
            "Feet + (Inches ÷ 12) = Decimal Feet",
            "Sq inches ÷ 144 = Sq feet",
            "Sq yards × 9 = Sq feet",
            "Linear ft × (width in ÷ 12) = Sq feet",
          ]}
        />
      </div>
    </CalcShell>
  );
}
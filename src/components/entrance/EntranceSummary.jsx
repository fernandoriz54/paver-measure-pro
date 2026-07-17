import React from "react";
import { formatValue } from "@/lib/measurementUtils";

// Combined entrance totals with formulas shown inline.
export default function EntranceSummary({ r, wastePct }) {
  const Row = ({ label, value, unit, formula }) => (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
      <div>
        <div className="text-sm font-semibold text-slate-700">{label}</div>
        {formula && <div className="text-[11px] text-slate-400 font-mono">{formula}</div>}
      </div>
      <div className="text-right">
        <span className="text-base font-bold text-slate-900">{formatValue(value, "hundredth")}</span>
        {unit && <span className="text-xs text-slate-400 ml-1">{unit}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-emerald-700 mb-1">Entrance Paver Area (sq ft)</h2>
        <Row label="Walkway" value={r.walkwayArea} unit="sf" />
        <Row label="Porch" value={r.porchArea} unit="sf" />
        <Row label="Landing" value={r.landingArea} unit="sf" />
        <Row label="Step treads" value={r.stepTreadArea} unit="sf" />
        <Row label="Riser faces" value={r.riserFaceArea} unit="sf" />
        <Row label="Step side faces (L / R)" value={r.sideFaceArea} unit="sf"
          formula={`Left ${formatValue(r.leftSideArea, "hundredth")} + Right ${formatValue(r.rightSideArea, "hundredth")}`} />
        <Row label="Border" value={r.borderArea} unit="sf"
          formula={`${formatValue(r.borderLinearTotal, "hundredth")} lin ft × ${formatValue(r.borderWidthFt, "hundredth")} ft`} />
        <div className="flex items-center justify-between py-2 bg-emerald-50 -mx-4 px-4 my-1">
          <span className="font-bold text-emerald-900">Gross entrance area</span>
          <span className="text-lg font-extrabold text-emerald-900">{formatValue(r.gross, "hundredth")} sf</span>
        </div>
        <Row label="Deducted areas" value={r.deductionArea} unit="sf" />
        <Row label="Net paver area" value={r.netArea} unit="sf"
          formula={`${formatValue(r.gross, "hundredth")} − ${formatValue(r.deductionArea, "hundredth")}`} />
        <Row label={`Waste (${wastePct}%)`} value={r.wasteArea} unit="sf"
          formula={`${formatValue(r.netArea, "hundredth")} × ${wastePct}%`} />
        <div className="flex items-center justify-between py-2 bg-emerald-800 text-white -mx-4 px-4 mt-1 rounded-b-xl">
          <span className="font-bold">Final paver order quantity</span>
          <span className="text-xl font-extrabold">{formatValue(r.finalQuantity, "hundredth")} sf</span>
        </div>
        {r.paverPallets > 0 && (
          <div className="text-xs text-slate-600 pt-1">Approx. paver pallets: <b>{r.paverPallets}</b></div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-amber-700 mb-1">Bullnose Edging (lin ft)</h2>
        <Row label="Step front edges + returns" value={r.stepBullnoseLinear} unit="lin ft" />
        <Row label="Landing bullnose" value={r.landingBullnoseLinear} unit="lin ft" />
        <Row label="Porch bullnose" value={r.porchBullnoseLinear} unit="lin ft" />
        <Row label="Additional / curved edges" value={r.extraBullnoseLinear} unit="lin ft" />
        <div className="flex items-center justify-between py-2 bg-amber-50 -mx-4 px-4 mt-1 rounded-b-xl">
          <span className="font-bold text-amber-900">Total bullnose</span>
          <span className="text-lg font-extrabold text-amber-900">{formatValue(r.totalBullnoseLinear, "hundredth")} lin ft</span>
        </div>
        {r.bullnoseFinalPieces > 0 && (
          <div className="mt-2 text-xs text-slate-600 bg-slate-50 rounded-md p-2 space-y-0.5">
            <div>Base pieces: <b>{r.bullnosePiecesBase}</b></div>
            <div>Waste pieces: <b>{r.bullnoseWastePieces}</b></div>
            <div className="font-semibold">Final quantity: {r.bullnoseFinalPieces} pieces</div>
            {r.bullnosePallets > 0 && <div>Approx. pallets/packages: <b>{r.bullnosePallets}</b></div>}
          </div>
        )}
      </div>
    </div>
  );
}
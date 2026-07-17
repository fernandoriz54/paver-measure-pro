import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, XCircle, Printer, ShieldCheck } from "lucide-react";
import { verificationChecks } from "@/lib/entranceUtils";
import { formatValue } from "@/lib/measurementUtils";

// Construction manager report + measurement verification checklist.
export default function EntranceReport({ p, r }) {
  const [confirmed, setConfirmed] = useState({ sketch: false, reviewed: false });
  const [verified, setVerified] = useState(false);
  const [showFail, setShowFail] = useState(false);

  const checks = verificationChecks(p, r, confirmed);
  const failed = checks.filter((c) => !c.pass);
  const canExport = failed.length === 0 && confirmed.sketch && confirmed.reviewed;

  const runVerify = () => {
    setVerified(true);
    setShowFail(failed.length > 0 || !confirmed.sketch || !confirmed.reviewed);
    if (canExport) setShowFail(false);
  };

  return (
    <div className="space-y-4 print-area">
      <div className="flex items-center justify-between no-print">
        <h2 className="text-base font-bold text-slate-800">Construction Manager Report</h2>
        <Button onClick={() => window.print()} disabled={!canExport} variant={canExport ? "default" : "secondary"}>
          <Printer size={16} className="mr-1.5" /> Print / Export
        </Button>
      </div>
      {!canExport && (
        <p className="no-print text-xs text-amber-700 bg-amber-50 border border-amber-300 rounded-lg p-2">
          Complete the verification checklist below before exporting the report.
        </p>
      )}

      {/* Verification checklist */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 no-print">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600 mb-2 flex items-center gap-1.5">
          <ShieldCheck size={16} /> Measurement Verification Checklist
        </h3>
        <div className="space-y-1.5">
          {checks.map((c) => (
            <div key={c.id} className="flex items-center gap-2 text-sm">
              {c.pass ? <CheckCircle2 size={16} className="text-emerald-600" /> : <XCircle size={16} className="text-red-500" />}
              <span className={c.pass ? "text-slate-700" : "text-red-600 font-medium"}>{c.label}</span>
              {c.manual && (
                <label className="ml-auto flex items-center gap-1 text-xs text-slate-500">
                  <Checkbox checked={confirmed[c.id] || false}
                    onCheckedChange={(v) => setConfirmed((s) => ({ ...s, [c.id]: v }))} />
                  Confirm
                </label>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <Button onClick={runVerify} className="flex-1">
            <ShieldCheck size={16} className="mr-1.5" /> Verify Measurements Before Submission
          </Button>
        </div>
        {verified && showFail && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
            {failed.length > 0 && <p>{failed.length} item(s) still need attention before submission.</p>}
            {!confirmed.sketch && <p>Field sketch must be completed.</p>}
            {!confirmed.reviewed && <p>Measurements must be reviewed a second time.</p>}
          </div>
        )}
        {verified && !showFail && canExport && (
          <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2">
            All measurements verified. Report ready to export.
          </div>
        )}
      </div>

      {/* Printable report */}
      <div className="bg-white rounded-xl border border-slate-300 p-5 space-y-4">
        <div className="text-center border-b border-slate-200 pb-3">
          <h2 className="text-xl font-extrabold text-slate-900">Home Entrance — Measurement Report</h2>
          <p className="text-xs text-slate-500">Prepared for construction manager turnover</p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <Info label="Client" value={p.clientName} />
          <Info label="Project address" value={p.projectAddress} />
          <Info label="Date measured" value={p.measuredDate} />
          <Info label="Design consultant" value={p.consultantName} />
          <Info label="Paver product" value={p.paverProduct.sizeLabel} />
          <Info label="Bullnose product" value={`${p.bullnoseProduct.lengthIn || 0} in`} />
          <Info label="Border width" value={`${p.border.widthIn || 0} in`} />
          <Info label="Waste %" value={`${p.wastePct}%`} />
        </div>

        <Section title="Entrance Overview">
          <Info label="Number of entrance sections" value={p.numSections} />
          <Info label="Number of steps" value={p.steps.length} />
          <Info label="Coverage" value={p.coverageMode} />
        </Section>

        <Section title="Area Totals (sq ft)">
          <Info label="Walkway" value={`${formatValue(r.walkwayArea, "hundredth")} sf`} />
          <Info label="Porch" value={`${formatValue(r.porchArea, "hundredth")} sf`} />
          <Info label="Landing" value={`${formatValue(r.landingArea, "hundredth")} sf`} />
          <Info label="Step treads" value={`${formatValue(r.stepTreadArea, "hundredth")} sf`} />
          <Info label="Riser faces" value={`${formatValue(r.riserFaceArea, "hundredth")} sf`} />
          <Info label="Side faces" value={`${formatValue(r.sideFaceArea, "hundredth")} sf`} />
          <Info label="Border" value={`${formatValue(r.borderArea, "hundredth")} sf`} />
          <Info label="Gross" value={`${formatValue(r.gross, "hundredth")} sf`} />
          <Info label="Deducted" value={`${formatValue(r.deductionArea, "hundredth")} sf`} />
          <Info label="Net" value={`${formatValue(r.netArea, "hundredth")} sf`} />
          <Info label="Waste" value={`${formatValue(r.wasteArea, "hundredth")} sf`} />
          <Info label="Final order quantity" value={`${formatValue(r.finalQuantity, "hundredth")} sf`} />
        </Section>

        <Section title="Bullnose (lin ft)">
          <Info label="Total bullnose" value={`${formatValue(r.totalBullnoseLinear, "hundredth")} lin ft`} />
          <Info label="Bullnose pieces" value={r.bullnoseFinalPieces} />
          {r.bullnosePallets > 0 && <Info label="Approx. pallets" value={r.bullnosePallets} />}
        </Section>

        <Section title="Step Measurements Table">
          <table className="w-full text-[11px] border border-slate-300">
            <thead className="bg-slate-100">
              <tr>
                {["Step", "Width", "Tread", "Riser", "Tread Area", "Riser Area", "Front BN", "Side Returns"].map((h) => (
                  <th key={h} className="border border-slate-300 px-1 py-1 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.stepsTable.map((s) => (
                <tr key={s.step}>
                  <td className="border border-slate-300 px-1">{s.step}</td>
                  <td className="border border-slate-300 px-1">{formatValue(s.width, "hundredth")}</td>
                  <td className="border border-slate-300 px-1">{formatValue(s.treadDepthFt, "hundredth")}</td>
                  <td className="border border-slate-300 px-1">{formatValue(s.riserHeightFt, "hundredth")}</td>
                  <td className="border border-slate-300 px-1">{formatValue(s.treadArea, "hundredth")}</td>
                  <td className="border border-slate-300 px-1">{formatValue(s.riserArea, "hundredth")}</td>
                  <td className="border border-slate-300 px-1">{formatValue(s.frontBullnose, "hundredth")}</td>
                  <td className="border border-slate-300 px-1">{formatValue(s.sideReturns, "hundredth")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Rise & Run">
          <Info label="Total rise" value={`${formatValue(r.totalRise, "hundredth")} ft`} />
          <Info label="Average riser" value={`${formatValue(r.avgRiser, "hundredth")} ft`} />
          <Info label="Total run" value={`${formatValue(r.totalRun, "hundredth")} ft`} />
          <Info label="Average tread" value={`${formatValue(r.avgTread, "hundredth")} ft`} />
          <Info label="Overall footprint" value={`${formatValue(r.footprint, "hundredth")} ft`} />
        </Section>

        <Section title="Deductions / Existing Conditions">
          {r.deductionItems.length === 0 && <p className="text-xs text-slate-400">None recorded.</p>}
          {r.deductionItems.map((d, i) => (
            <Info key={i} label={d.label} value={`${formatValue(d.area, "hundredth")} sf`} />
          ))}
        </Section>

        <Section title="Notes & Installation Concerns">
          <p className="text-xs text-slate-600 whitespace-pre-wrap">{p.notes || "—"}</p>
          {r.inconsistentRisers && (
            <p className="text-xs text-amber-700 mt-1">⚠ Riser heights are inconsistent — verify before construction.</p>
          )}
        </Section>
      </div>
    </div>
  );
}

const Info = ({ label, value }) => (
  <div className="flex justify-between gap-2">
    <span className="text-slate-500">{label}:</span>
    <span className="font-semibold text-slate-800 text-right">{value || "—"}</span>
  </div>
);
const Section = ({ title, children }) => (
  <div className="border-t border-slate-200 pt-2">
    <h3 className="text-sm font-bold text-slate-700 mb-1">{title}</h3>
    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">{children}</div>
  </div>
);
import React from "react";
import { Image as ImageIcon, FileText, Table } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// Export a captured area as PNG or PDF, and download a CSV of measurements.
export default function ExportBar({ targetRef, sections, fileBase = "combined-section" }) {
  const capture = async () => {
    const el = targetRef && targetRef.current;
    if (!el) return null;
    return await html2canvas(el, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
  };

  const exportImage = async () => {
    const canvas = await capture();
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${fileBase}.png`;
    a.click();
  };

  const exportPdf = async () => {
    const canvas = await capture();
    if (!canvas) return;
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? "landscape" : "portrait",
      unit: "pt",
      format: "a4",
    });
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const ratio = Math.min((pw - 40) / canvas.width, (ph - 60) / canvas.height);
    const w = canvas.width * ratio;
    const h = canvas.height * ratio;
    pdf.addImage(img, "PNG", (pw - w) / 2, 40, w, h);
    pdf.save(`${fileBase}.pdf`);
  };

  const downloadCsv = () => {
    const rows = [["Section", "Shape", "Parameters", "Gross sq ft", "Deductions sq ft", "Net sq ft", "Linear ft"]];
    sections.forEach((s) => {
      const params = Object.entries(s.params || {})
        .map(([k, v]) => `${k}: ${v}`)
        .join(" | ");
      rows.push([
        s.label,
        s.type,
        params,
        s.gross,
        s.totalDeduct,
        s.net,
        s.type === "path" ? s.params.linear || 0 : 0,
      ]);
    });
    const totals = sections.reduce(
      (a, s) => ({ g: a.g + s.gross, d: a.d + s.totalDeduct, n: a.n + s.net, l: a.l + (s.type === "path" ? s.params.linear || 0 : 0) }),
      { g: 0, d: 0, n: 0, l: 0 }
    );
    rows.push(["TOTAL", "", "", totals.g, totals.d, totals.n, totals.l]);
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${fileBase}.csv`;
    a.click();
  };

  const Btn = ({ icon: Icon, label, onClick, color }) => (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-sm font-semibold text-white shadow-sm active:scale-95 transition ${color}`}
    >
      <Icon size={16} /> <span className="truncate">{label}</span>
    </button>
  );

  return (
    <div className="grid grid-cols-3 gap-2">
      <Btn icon={ImageIcon} label="Image" onClick={exportImage} color="bg-indigo-600" />
      <Btn icon={FileText} label="PDF" onClick={exportPdf} color="bg-rose-600" />
      <Btn icon={Table} label="CSV" onClick={downloadCsv} color="bg-slate-700" />
    </div>
  );
}
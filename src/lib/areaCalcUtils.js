// Shared calculation + verification helpers for Phase 2 area calculators
// (patios, walkways, turf, driveways, borders). Full precision internally;
// callers round only for display. Field-measured values are authoritative.
import { applyWaste, calcCircleFromDiameter, calcTrapezoid, PI } from "@/lib/measurementUtils";

export const P = "hundredth";
export const fmt = (v) => (Number.isFinite(v) ? v.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "0");

// Sum of rectangular sections [{length,width}] → { area, perimeter, labels }
export function sectionsArea(secs) {
  const list = Array.isArray(secs) ? secs.filter((s) => s && (s.length || s.width)) : [];
  let area = 0, perimeter = 0;
  const labels = list.map((s, i) => ({
    label: String.fromCharCode(65 + i),
    area: (s.length || 0) * (s.width || 0),
  }));
  for (const s of list) {
    area += (s.length || 0) * (s.width || 0);
    perimeter += 2 * ((s.length || 0) + (s.width || 0));
  }
  return { area, perimeter, count: list.length, labels };
}

// Average of a widths array (ft). Returns 0 if empty.
export function avgWidth(widths) {
  const w = (Array.isArray(widths) ? widths : []).filter((x) => Number.isFinite(x) && x > 0);
  if (!w.length) return 0;
  return w.reduce((a, b) => a + b, 0) / w.length;
}

// Tree-well / circular deduction area from diameter (ft)
export function circleAreaFromDiameter(d) {
  if (!d) return 0;
  return calcCircleFromDiameter(d).area;
}

// Ring (annulus) area from inner + outer diameter (ft)
export function ringArea(innerD, outerD) {
  const o = Math.max(innerD || 0, outerD || 0);
  const i = Math.min(innerD || 0, outerD || 0);
  return (PI / 4) * (o * o - i * i);
}

// Trapezoid area from two parallel widths + height (depth)
export function trapezoidArea(w1, w2, depth) {
  return calcTrapezoid(w1 || 0, w2 || 0, depth || 0).area;
}

// Stepping-slab path: slab size in inches, gap in inches, count, rows
export function steppingSlabs({ slabLengthIn, slabWidthIn, count, gapIn = 0, rows = 1 }) {
  const slabArea = ((slabLengthIn || 0) * (slabWidthIn || 0)) / 144;
  const totalSlabArea = slabArea * (count || 0) * (rows || 1);
  const totalRun = ((count || 0) * ((slabLengthIn || 0) + (gapIn || 0))) / 12;
  return { slabArea, totalSlabArea, totalRun };
}

// Border: effective linear run minus shared/no-border edges
export function borderLinear({ totalRun, sharedEdges = 0, noBorderEdges = 0 }) {
  return Math.max(0, (totalRun || 0) - (sharedEdges || 0) - (noBorderEdges || 0));
}

// Border area from effective linear, width (in), rows
export function borderAreaFromLinear(linearFt, widthIn, rows = 1) {
  return linearFt * ((widthIn || 0) / 12) * (rows || 1);
}

// Net area with a deductions object; never goes below 0
export function netArea(gross, deductions) {
  return Math.max(0, (gross || 0) - (deductions || 0));
}

// Build a review-row object
export const row = (label, value, unit, kind) => ({ label, value, unit, kind });
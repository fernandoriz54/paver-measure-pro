import { PI, formatValue } from "@/lib/measurementUtils";

// Named obstacle presets — kind drives the area formula, needs drives which inputs show.
export const DEDUCT_PRESETS = [
  { name: "Rectangle", kind: "rect", needs: ["length", "width"] },
  { name: "Square", kind: "square", needs: ["side"] },
  { name: "Triangle", kind: "triangle", needs: ["base", "height"] },
  { name: "Full Circle", kind: "circle", needs: ["radius"] },
  { name: "Half Circle", kind: "half", needs: ["radius"] },
  { name: "Quarter Circle", kind: "quarter", needs: ["radius"] },
  { name: "Planter Bed", kind: "rect", needs: ["length", "width"] },
  { name: "Section Cut-Off", kind: "rect", needs: ["length", "width"] },
  { name: "Corner Notch", kind: "triangle", needs: ["base", "height"] },
  { name: "Tree", kind: "circle", needs: ["diameter"] },
  { name: "Light Post", kind: "circle", needs: ["diameter"] },
  { name: "Electrical Unit", kind: "rect", needs: ["length", "width"] },
  { name: "AC Unit", kind: "rect", needs: ["length", "width"] },
  { name: "Fence", kind: "rect", needs: ["length", "width"] },
  { name: "Path / Walk", kind: "path", needs: ["linear", "width"] },
];

export const presetByName = (nm) => DEDUCT_PRESETS.find((p) => p.name === nm) || DEDUCT_PRESETS[0];

export function deductArea(kind, p = {}) {
  switch (kind) {
    case "circle": return p.diameter != null ? PI * ((p.diameter || 0) / 2) ** 2 : PI * (p.radius || 0) ** 2;
    case "half": return 0.5 * PI * (p.radius || 0) ** 2;
    case "quarter": return 0.25 * PI * (p.radius || 0) ** 2;
    case "square": return (p.side || 0) ** 2;
    case "triangle": return 0.5 * (p.base || 0) * (p.height || 0);
    case "path": return (p.linear || 0) * (p.width || 0);
    default: return (p.length || 0) * (p.width || 0); // rect
  }
}

export function deductFormula(kind, p = {}, area) {
  switch (kind) {
    case "circle": return p.diameter != null ? `${PI} × (${fmt(p.diameter)}÷2)² = ${fmt(area)}` : `${PI} × ${fmt(p.radius)}² = ${fmt(area)}`;
    case "half": return `½ × ${PI} × ${fmt(p.radius)}² = ${fmt(area)}`;
    case "quarter": return `¼ × ${PI} × ${fmt(p.radius)}² = ${fmt(area)}`;
    case "square": return `${fmt(p.side)} × ${fmt(p.side)} = ${fmt(area)}`;
    case "triangle": return `½ × ${fmt(p.base)} × ${fmt(p.height)} = ${fmt(area)}`;
    case "path": return `${fmt(p.linear)} × ${fmt(p.width)} = ${fmt(area)}`;
    default: return `${fmt(p.length)} × ${fmt(p.width)} = ${fmt(area)}`;
  }
}

export function shapeGross(type, p = {}) {
  switch (type) {
    case "rectangle": return (p.length || 0) * (p.width || 0);
    case "half": return 0.5 * PI * (p.radius || 0) ** 2;
    case "quarter": return 0.25 * PI * (p.radius || 0) ** 2;
    case "circle": return PI * (p.radius || 0) ** 2;
    case "triangle": return 0.5 * (p.base || 0) * (p.height || 0);
    case "trapezoid": return ((p.a || 0) + (p.b || 0)) / 2 * (p.height || 0);
    case "path": return (p.linear || 0) * (p.width || 0);
    default: return 0;
  }
}

export function totalDeductionArea(deductions = []) {
  return deductions.reduce((sum, d) => sum + deductArea(d.kind, d.params), 0);
}

export const fmt = (n) => formatValue(n || 0, "hundredth");

export function deductLabelFor(key) {
  const map = {
    length: "Length", width: "Width", radius: "Radius", base: "Base", height: "Height",
    a: "Side A (top)", b: "Side B (bottom)", diameter: "Diameter", linear: "Linear Length",
    side: "Side",
  };
  return map[key] || key;
}

let _dId = 0;
export function newDeduction(name = "Tree") {
  const preset = presetByName(name);
  const params = {};
  preset.needs.forEach((k) => (params[k] = 0));
  return { id: `d${Date.now()}-${++_dId}`, name, kind: preset.kind, params };
}

// Build a representative square section from a lone area value (for calcs that only know sq ft).
export function squareSection(area, label = "Area", id = "area-section") {
  const s = Math.sqrt(Math.max(0, area || 0));
  return { id, type: "rectangle", label, params: { length: s, width: s } };
}
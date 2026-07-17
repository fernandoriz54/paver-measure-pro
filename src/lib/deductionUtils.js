import { PI, formatValue } from "@/lib/measurementUtils";

// Categorized obstacle/deduction catalog. Each item maps to a shape `kind`
// and a list of `needs` (param keys). The selector reads this; the panel and
// calculators read the resulting deduction objects.
export const OBSTACLE_CATALOG = [
  {
    category: "Basic Shapes",
    items: [
      { name: "Rectangle", kind: "rect", needs: ["length", "width"] },
      { name: "Square", kind: "square", needs: ["side"] },
      { name: "Circle", kind: "circle", needs: ["diameter"] },
      { name: "Half Circle", kind: "half", needs: ["radius"] },
      { name: "Quarter Circle", kind: "quarter", needs: ["radius"] },
      { name: "Semicircle", kind: "half", needs: ["radius"] },
      { name: "Triangle", kind: "triangle", needs: ["base", "height"] },
      { name: "Trapezoid", kind: "trapezoid", needs: ["a", "b", "height"] },
      { name: "Oval / Ellipse", kind: "oval", needs: ["length", "width"] },
      { name: "Custom Polygon", kind: "manual", needs: ["area"] },
      { name: "Manual Square Footage", kind: "manual", needs: ["area"] },
    ],
  },
  {
    category: "Paths & Surfaces",
    items: [
      { name: "Straight Walkway", kind: "path", needs: ["linear", "width"] },
      { name: "Curved Walkway", kind: "path", needs: ["linear", "width"] },
      { name: "Existing Concrete Path", kind: "path", needs: ["linear", "width"] },
      { name: "Existing Paver Path", kind: "path", needs: ["linear", "width"] },
      { name: "Driveway Section", kind: "rect", needs: ["length", "width"] },
      { name: "Patio Section", kind: "rect", needs: ["length", "width"] },
      { name: "Porch", kind: "rect", needs: ["length", "width"] },
      { name: "Landing", kind: "rect", needs: ["length", "width"] },
      { name: "Existing Steps", kind: "rect", needs: ["length", "width"] },
      { name: "Area Remaining Untouched", kind: "rect", needs: ["length", "width"] },
      { name: "Section Cut-Off", kind: "rect", needs: ["length", "width"] },
      { name: "Corner Notch", kind: "triangle", needs: ["base", "height"] },
      { name: "Custom Surface", kind: "manual", needs: ["area"] },
    ],
  },
  {
    category: "Landscape Obstacles",
    items: [
      { name: "Tree", kind: "circle", needs: ["diameter"] },
      { name: "Tree Well", kind: "circle", needs: ["diameter"] },
      { name: "Planter", kind: "rect", needs: ["length", "width"] },
      { name: "Raised Planter", kind: "rect", needs: ["length", "width"] },
      { name: "Planter Bed", kind: "rect", needs: ["length", "width"] },
      { name: "Flower Bed", kind: "rect", needs: ["length", "width"] },
      { name: "Garden Area", kind: "rect", needs: ["length", "width"] },
      { name: "Rock Area", kind: "rect", needs: ["length", "width"] },
      { name: "Mulch Area", kind: "rect", needs: ["length", "width"] },
      { name: "Existing Lawn", kind: "rect", needs: ["length", "width"] },
      { name: "Shrub Area", kind: "circle", needs: ["diameter"] },
      { name: "Custom Landscape Area", kind: "manual", needs: ["area"] },
    ],
  },
  {
    category: "Property & Structural Obstacles",
    items: [
      { name: "House Footprint", kind: "rect", needs: ["length", "width"] },
      { name: "Wall", kind: "rect", needs: ["length", "width"] },
      { name: "Fence", kind: "rect", needs: ["length", "width"] },
      { name: "Gate", kind: "rect", needs: ["length", "width"] },
      { name: "Column", kind: "square", needs: ["side"] },
      { name: "Post", kind: "square", needs: ["side"] },
      { name: "Pillar", kind: "square", needs: ["side"] },
      { name: "Retaining Wall", kind: "rect", needs: ["length", "width"] },
      { name: "Shed", kind: "rect", needs: ["length", "width"] },
      { name: "Pergola Post", kind: "square", needs: ["side"] },
      { name: "Patio-Cover Post", kind: "square", needs: ["side"] },
      { name: "Pool", kind: "rect", needs: ["length", "width"] },
      { name: "Spa", kind: "circle", needs: ["diameter"] },
      { name: "Fire Pit", kind: "circle", needs: ["diameter"] },
      { name: "Outdoor Kitchen", kind: "rect", needs: ["length", "width"] },
      { name: "Existing Structure", kind: "rect", needs: ["length", "width"] },
      { name: "Custom Structure", kind: "manual", needs: ["area"] },
    ],
  },
  {
    category: "Utilities & Equipment",
    items: [
      { name: "AC Unit", kind: "rect", needs: ["length", "width"] },
      { name: "Electrical Unit", kind: "rect", needs: ["length", "width"] },
      { name: "Electrical Panel", kind: "rect", needs: ["length", "width"] },
      { name: "Utility Box", kind: "rect", needs: ["length", "width"] },
      { name: "Transformer", kind: "rect", needs: ["length", "width"] },
      { name: "Gas Meter", kind: "rect", needs: ["length", "width"] },
      { name: "Water Meter", kind: "rect", needs: ["length", "width"] },
      { name: "Drain", kind: "circle", needs: ["diameter"] },
      { name: "Cleanout", kind: "circle", needs: ["diameter"] },
      { name: "Irrigation Box", kind: "square", needs: ["side"] },
      { name: "Sprinkler Valve Box", kind: "square", needs: ["side"] },
      { name: "Light Post", kind: "circle", needs: ["diameter"] },
      { name: "Downspout", kind: "circle", needs: ["diameter"] },
      { name: "Hose Bib Area", kind: "rect", needs: ["length", "width"] },
      { name: "Septic Access", kind: "rect", needs: ["length", "width"] },
      { name: "Custom Utility Obstacle", kind: "manual", needs: ["area"] },
    ],
  },
  {
    category: "Entrance & Step Obstacles",
    items: [
      { name: "Door Threshold", kind: "rect", needs: ["length", "width"] },
      { name: "Front Door Area", kind: "rect", needs: ["length", "width"] },
      { name: "Porch Column", kind: "square", needs: ["side"] },
      { name: "Landing Cut-Out", kind: "rect", needs: ["length", "width"] },
      { name: "Step Cut-Out", kind: "rect", needs: ["length", "width"] },
      { name: "Stair Side", kind: "rect", needs: ["length", "width"] },
      { name: "Existing Bullnose Edge", kind: "path", needs: ["linear", "width"] },
      { name: "Bullnose Edge Excluded", kind: "path", needs: ["linear", "width"] },
      { name: "Existing Riser", kind: "rect", needs: ["length", "width"] },
      { name: "Area Not Receiving Pavers", kind: "rect", needs: ["length", "width"] },
      { name: "Custom Entrance Deduction", kind: "manual", needs: ["area"] },
    ],
  },
];

// Flat list (backward-compatible export) + name lookup.
export const DEDUCT_PRESETS = OBSTACLE_CATALOG.flatMap((c) => c.items);
export const presetByName = (nm) =>
  DEDUCT_PRESETS.find((p) => p.name === nm) || DEDUCT_PRESETS[0];

export const DEDUCT_COLORS = [
  "#dc2626", "#ea580c", "#ca8a04", "#16a34a",
  "#0891b2", "#2563eb", "#7c3aed", "#db2777",
];

// Area for one deduction. `qty` multiplies (defaults to 1 for legacy records).
export function deductArea(kind, p = {}, qty = 1) {
  let a = 0;
  switch (kind) {
    case "circle":
      a = p.diameter != null ? PI * ((p.diameter || 0) / 2) ** 2 : PI * (p.radius || 0) ** 2;
      break;
    case "half": a = 0.5 * PI * (p.radius || 0) ** 2; break;
    case "quarter": a = 0.25 * PI * (p.radius || 0) ** 2; break;
    case "square": a = (p.side || 0) ** 2; break;
    case "triangle": a = 0.5 * (p.base || 0) * (p.height || 0); break;
    case "trapezoid": a = ((p.a || 0) + (p.b || 0)) / 2 * (p.height || 0); break;
    case "oval": a = PI * ((p.length || 0) / 2) * ((p.width || 0) / 2); break;
    case "manual": a = p.area || 0; break;
    case "path": a = (p.linear || 0) * (p.width || 0); break;
    default: a = (p.length || 0) * (p.width || 0); // rect
  }
  return a * (qty || 1);
}

export function deductFormula(kind, p = {}, area, qty = 1) {
  let base;
  switch (kind) {
    case "circle":
      base = p.diameter != null
        ? `${PI} × (${fmt(p.diameter)}÷2)²`
        : `${PI} × ${fmt(p.radius)}²`;
      break;
    case "half": base = `½ × ${PI} × ${fmt(p.radius)}²`; break;
    case "quarter": base = `¼ × ${PI} × ${fmt(p.radius)}²`; break;
    case "square": base = `${fmt(p.side)} × ${fmt(p.side)}`; break;
    case "triangle": base = `½ × ${fmt(p.base)} × ${fmt(p.height)}`; break;
    case "trapezoid": base = `(${fmt(p.a)} + ${fmt(p.b)}) ÷ 2 × ${fmt(p.height)}`; break;
    case "oval": base = `${PI} × (${fmt(p.length)}÷2) × (${fmt(p.width)}÷2)`; break;
    case "manual": base = `${fmt(p.area)}`; break;
    case "path": base = `${fmt(p.linear)} × ${fmt(p.width)}`; break;
    default: base = `${fmt(p.length)} × ${fmt(p.width)}`;
  }
  return qty > 1 ? `${base} × ${qty} = ${fmt(area)}` : `${base} = ${fmt(area)}`;
}

// Gross area for a drawn section shape (visualizer).
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

// Sum of every deduction's area (active or not) — for display.
export function totalDeductionArea(deductions = []) {
  return deductions.reduce((sum, d) => sum + deductArea(d.kind, d.params, d.quantity || 1), 0);
}

// Sum of only deductions whose "Subtract from total" toggle is ON.
// excludeKinds lets a calculator keep linear (path) deductions separate from
// square-foot deductions (e.g. Steps & Entrance).
export function activeDeductionArea(deductions = [], excludeKinds = []) {
  return deductions.reduce((sum, d) => {
    if (d.subtract === false) return sum;
    if (excludeKinds.includes(d.kind)) return sum;
    return sum + deductArea(d.kind, d.params, d.quantity || 1);
  }, 0);
}

// Sum of linear feet from active path-kind deductions (border / bullnose exclusions).
export function activeDeductionLinear(deductions = []) {
  return deductions.reduce((sum, d) => {
    if (d.subtract === false) return sum;
    if (d.kind !== "path") return sum;
    return sum + ((d.params && d.params.linear) || 0);
  }, 0);
}

// Heuristic duplicate / double-deduction warnings.
export function detectDuplicates(deductions = []) {
  const warnings = [];
  const seen = {};
  deductions.forEach((d) => {
    const area = deductArea(d.kind, d.params, d.quantity || 1);
    const key = `${d.name}|${Math.round(area * 100)}`;
    if (seen[key]) {
      warnings.push(`“${d.name}” appears more than once with the same area — this may already have been deducted. Review before continuing.`);
    }
    seen[key] = true;
  });
  return warnings;
}

export const fmt = (n) => formatValue(n || 0, "hundredth");

export function deductLabelFor(key) {
  const map = {
    length: "Length", width: "Width", radius: "Radius", base: "Base", height: "Height",
    a: "Side A (top)", b: "Side B (bottom)", diameter: "Diameter", linear: "Linear Length",
    side: "Side", area: "Area (sq ft)",
  };
  return map[key] || key;
}

let _dId = 0;
export function newDeduction(name = "Tree") {
  const preset = presetByName(name);
  const params = {};
  preset.needs.forEach((k) => (params[k] = 0));
  _dId += 1;
  return {
    id: `d${Date.now()}-${_dId}`,
    name,
    label: name,
    kind: preset.kind,
    params,
    quantity: 1,
    subtract: true,
    includeReport: true,
    color: DEDUCT_COLORS[_dId % DEDUCT_COLORS.length],
    notes: "",
    section: "",
    hidden: false,
    locked: false,
    favorite: false,
  };
}

// Build a representative square section from a lone area value.
export function squareSection(area, label = "Area", id = "area-section") {
  const s = Math.sqrt(Math.max(0, area || 0));
  return { id, type: "rectangle", label, params: { length: s, width: s } };
}
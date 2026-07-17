// Shared measurement + calculation utilities for Paver Measure Pro

export const PI = 3.1416;

// Convert feet + inches to decimal feet
export function feetInchesToDecimal(feet, inches) {
  const f = parseFloat(feet) || 0;
  const i = parseFloat(inches) || 0;
  return f + i / 12;
}

// Convert decimal feet to feet + inches
export function decimalToFeetInches(decimal) {
  const d = parseFloat(decimal) || 0;
  const feet = Math.floor(d);
  const inches = Math.round((d - feet) * 12);
  return { feet, inches: inches === 12 ? 0 : inches, inchesRaw: inches };
}

// Round based on preference
export function roundValue(value, precision) {
  const v = parseFloat(value);
  if (isNaN(v)) return 0;
  switch (precision) {
    case "exact":
      return v;
    case "hundredth":
      return Math.round(v * 100) / 100;
    case "tenth":
      return Math.round(v * 10) / 10;
    case "whole":
      return Math.round(v);
    default:
      return Math.round(v * 100) / 100;
  }
}

export function formatValue(value, precision) {
  const rounded = roundValue(value, precision);
  if (precision === "exact") {
    return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  }
  return rounded.toLocaleString("en-US", { maximumFractionDigits: precision === "whole" ? 0 : precision === "tenth" ? 1 : 2 });
}

// Rectangle/Square
export function calcRectangle(lengthFt, widthFt) {
  const area = lengthFt * widthFt;
  const perimeter = 2 * (lengthFt + widthFt);
  return { area, perimeter, linearFeet: perimeter };
}

// Triangle (base/height)
export function calcTriangle(baseFt, heightFt) {
  return { area: (baseFt * heightFt) / 2 };
}

// Triangle (3 sides) - Heron's formula
export function calcTriangleSides(a, b, c) {
  const s = (a + b + c) / 2;
  const area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
  const perimeter = a + b + c;
  return { area, perimeter };
}

// Trapezoid
export function calcTrapezoid(a, b, height) {
  return { area: ((a + b) / 2) * height };
}

// Circle
export function calcCircleFromDiameter(d) {
  const radius = d / 2;
  const circumference = d * PI;
  const area = PI * radius * radius;
  return { radius, diameter: d, circumference, area };
}
export function calcCircleFromRadius(r) {
  const diameter = r * 2;
  const circumference = diameter * PI;
  const area = PI * r * r;
  return { radius: r, diameter, circumference, area };
}
export function calcCircleFromCircumference(c) {
  const diameter = c / PI;
  const radius = diameter / 2;
  const area = PI * radius * radius;
  return { radius, diameter, circumference: c, area };
}

// Partial circle
export function calcPartialCircle(radius, percent) {
  const full = calcCircleFromRadius(radius);
  return { ...full, area: (full.area * percent) / 100, isPartial: true, percent };
}

// Apply waste percentage
export function applyWaste(area, wastePercent) {
  const wasteAmount = area * (wastePercent / 100);
  return { wasteAmount, total: area + wasteAmount };
}

// Border / edging
export function calcBorder(linearFeet, borderWidthIn, rows = 1) {
  const widthFt = borderWidthIn / 12;
  const borderArea = linearFeet * widthFt * rows;
  return { borderArea, widthFt, linearFeet, rows };
}

// Steps & Stairs
export function calcSteps({ numSteps, totalHeight, stepWidth, treadDepth, landingDepth = 0, numLandings = 0 }) {
  const numRisers = numSteps;
  const risePerStep = numRisers > 0 ? totalHeight / numRisers : 0;
  const totalRun = treadDepth * numRisers;
  const totalDepth = totalRun + landingDepth * numLandings;
  const stepSurfaceArea = treadDepth * stepWidth * numSteps;
  const riserFaceArea = risePerStep * stepWidth * numRisers;
  const landingArea = landingDepth * stepWidth * numLandings;
  const totalStepArea = stepSurfaceArea + landingArea;
  return {
    numRisers,
    risePerStep,
    totalRun,
    totalDepth,
    stepSurfaceArea,
    riserFaceArea,
    landingArea,
    totalStepArea,
  };
}

// Bullnose pieces
export function calcBullnose(bullnoseLinearFt, pieceLengthFt) {
  if (!pieceLengthFt) return { pieces: 0 };
  return { pieces: Math.ceil(bullnoseLinearFt / pieceLengthFt) };
}

// Material quantity
export function calcMaterial(area, product) {
  if (!product) return null;
  const sqftPerPiece = (product.length_in || 0) * (product.width_in || 0) / 144;
  const piecesRequired = sqftPerPiece > 0 ? Math.ceil(area / sqftPerPiece) : 0;
  const palletsRequired = product.sqft_per_pallet > 0 ? Math.ceil(area / product.sqft_per_pallet) : 0;
  const coveredSqft = sqftPerPiece * piecesRequired;
  let estimatedCost = 0;
  if (product.cost_per_sqft) estimatedCost = area * product.cost_per_sqft;
  else if (product.cost_per_piece) estimatedCost = piecesRequired * product.cost_per_piece;
  else if (product.cost_per_pallet) estimatedCost = palletsRequired * product.cost_per_pallet;
  return { sqftPerPiece, piecesRequired, palletsRequired, coveredSqft, estimatedCost };
}

// Validation warnings
export function validateMeasurements(measurements, type) {
  const warnings = [];
  const { feet, inches, lengthFt, widthFt, baseFt, heightFt, diameter, radius, circumference, grossArea, deductions, wastePercent, totalHeight, numSteps } = measurements;

  if (inches !== undefined && inches !== "" && (parseFloat(inches) >= 12)) {
    warnings.push("Inches entered are 12 or greater — convert to feet instead (12 inches = 1 foot).");
  }
  if (feet !== undefined && feet !== "" && parseFloat(feet) < 0) warnings.push("Negative feet value detected.");
  if (lengthFt !== undefined && lengthFt !== "" && parseFloat(lengthFt) < 0) warnings.push("Negative length value detected.");
  if (widthFt !== undefined && widthFt !== "" && parseFloat(widthFt) < 0) warnings.push("Negative width value detected.");
  if (type === "circle" && diameter !== undefined && diameter !== "" && radius !== undefined && radius !== "") {
    warnings.push("Both diameter and radius entered — only one is needed.");
  }
  if (grossArea !== undefined && deductions !== undefined) {
    const g = parseFloat(grossArea) || 0;
    const d = parseFloat(deductions) || 0;
    if (d > g) warnings.push("Deductions are larger than the gross area — check your measurements.");
  }
  if (wastePercent !== undefined && wastePercent !== "") {
    const w = parseFloat(wastePercent) || 0;
    if (w > 25) warnings.push("Waste percentage is unusually high — verify this is intentional.");
  }
  if (type === "steps" && totalHeight !== undefined && numSteps !== undefined) {
    const h = parseFloat(totalHeight) || 0;
    const n = parseInt(numSteps) || 0;
    if (n > 0) {
      const rise = h / n;
      if (rise > 8) warnings.push("Riser height exceeds 8 inches — this may be too steep. Typical residential range is 6–8 inches.");
      if (rise < 4 && rise > 0) warnings.push("Riser height is below 4 inches — this may be too shallow.");
    }
  }
  return warnings;
}

export const WASTE_OPTIONS = [
  { value: 5, label: "5%" },
  { value: 7, label: "7%" },
  { value: 10, label: "10%" },
  { value: 12, label: "12%" },
  { value: 15, label: "15%" },
];

export const PATTERN_WASTE_RECOMMEND = {
  straight: 5,
  running_bond: 7,
  combo: 10,
  diagonal: 12,
  curves: 15,
  irregular: 15,
};

export const PRESET_PRODUCT_SIZES = [
  { label: "4 × 8", length_in: 8, width_in: 4 },
  { label: "6 × 9", length_in: 9, width_in: 6 },
  { label: "6 × 12", length_in: 12, width_in: 6 },
  { label: "7 × 14", length_in: 14, width_in: 7 },
  { label: "12 × 12", length_in: 12, width_in: 12 },
  { label: "12 × 24", length_in: 24, width_in: 12 },
  { label: "24 × 24", length_in: 24, width_in: 24 },
  { label: "Three-piece combo", length_in: 0, width_in: 0 },
  { label: "Custom", length_in: 0, width_in: 0 },
];

export const BORDER_WIDTH_OPTIONS = [
  { label: "4 inches", value: 4 },
  { label: "6 inches", value: 6 },
  { label: "8 inches", value: 8 },
  { label: "9 inches", value: 9 },
  { label: "12 inches", value: 12 },
];

export const BORDER_STYLES = [
  "Running bond",
  "Soldier course",
  "Sailor course",
  "Double border",
  "Contrasting accent border",
  "Custom border",
];

export const TURF_ROLL_WIDTHS = [15, 12];
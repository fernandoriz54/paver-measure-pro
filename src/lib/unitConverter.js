// Universal measurement parser + conversion engine for Paver Measure Pro.
// Supports free-form input like: 8' 6", 8 feet 6 inches, 8.5 ft, 102 in, 8', 8 ft.

const fmt = (n, d = 4) => {
  if (!isFinite(n)) return "—";
  const r = Math.round(n * 10 ** d) / 10 ** d;
  return String(r);
};

// Parse a free-form measurement string into decimal feet (and raw inch sum).
export function parseMeasurement(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return { ok: false, feet: 0, inches: 0, raw: "", feetDisplay: "" };
  const lower = raw.toLowerCase().replace(/,/g, "");
  const ftMatches = [...lower.matchAll(/(\d+(?:\.\d+)?)\s*(?:ft|feet|')/g)];
  const inMatches = [...lower.matchAll(/(\d+(?:\.\d+)?)\s*(?:in|inch|inches|")/g)];
  let feet = 0;
  let inches = 0;
  let hasUnit = false;
  ftMatches.forEach((m) => { feet += parseFloat(m[1]); hasUnit = true; });
  inMatches.forEach((m) => { inches += parseFloat(m[1]); hasUnit = true; });
  if (!hasUnit) {
    const num = parseFloat(raw);
    if (isNaN(num)) return { ok: false, feet: 0, inches: 0, raw, feetDisplay: "" };
    feet = num; // plain number treated as feet
  }
  const totalFeet = feet + inches / 12;
  const ftWhole = Math.floor(totalFeet);
  const inRem = Math.round((totalFeet - ftWhole) * 12);
  const feetDisplay = hasUnit
    ? `${fmt(feet, 2)} ft ${fmt(inches, 2)} in  =  ${fmt(totalFeet)} decimal ft`
    : `${fmt(totalFeet)} ft`;
  return { ok: true, feet: totalFeet, inches, raw, feetDisplay, ftWhole, inRem };
}

// Parse a plain numeric value from a string (strips units/symbols).
export function parseNumber(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return null;
  const cleaned = raw.replace(/[^0-9.\-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

// Each conversion: { id, label, mixed?, needsWidth?, custom?, run(n|parsed, widthFt, parsed, factor) -> {value, unit, formula, warning?, insert?} }
export const CONVERSIONS = [
  { id: "ftin_to_decimal", label: "Feet & Inches → Decimal Feet", mixed: true,
    run: (parsed) => ({ value: fmt(parsed.feet), unit: "ft", formula: `${parsed.feetDisplay}`, insert: fmt(parsed.feet) }) },
  { id: "decimal_to_ftin", label: "Decimal Feet → Feet & Inches", mixed: true,
    run: (parsed) => {
      const ft = Math.floor(parsed.feet);
      const in_ = Math.round((parsed.feet - ft) * 12);
      return { value: `${ft}' ${in_}"`, unit: "", formula: `${fmt(parsed.feet)} ft  →  ${ft} ft ${in_} in`, insert: fmt(parsed.feet) };
    } },
  { id: "in_to_ft", label: "Inches → Feet",
    run: (n) => ({ value: fmt(n / 12), unit: "ft", formula: `${fmt(n)} in ÷ 12 = ${fmt(n / 12)} ft`, insert: fmt(n / 12) }) },
  { id: "ft_to_in", label: "Feet → Inches",
    run: (n) => ({ value: fmt(n * 12), unit: "in", formula: `${fmt(n)} ft × 12 = ${fmt(n * 12)} in`, insert: fmt(n) }) },
  { id: "lin_to_sq", label: "Linear Feet → Square Feet", needsWidth: true,
    run: (n, widthFt) => {
      if (!widthFt) return { warning: "Linear feet cannot be converted into square feet until a width is provided." };
      return { value: fmt(n * widthFt), unit: "sq ft", formula: `${fmt(n)} ft × ${fmt(widthFt)} ft = ${fmt(n * widthFt)} sq ft`, insert: fmt(n * widthFt) };
    } },
  { id: "sq_to_lin", label: "Square Feet → Linear Feet", needsWidth: true,
    run: (n, widthFt) => {
      if (!widthFt) return { warning: "Square feet cannot be converted into linear feet until a width is provided." };
      return { value: fmt(n / widthFt), unit: "lin ft", formula: `${fmt(n)} sq ft ÷ ${fmt(widthFt)} ft = ${fmt(n / widthFt)} linear ft`, insert: fmt(n / widthFt) };
    } },
  { id: "sqin_to_sqft", label: "Square Inches → Square Feet",
    run: (n) => ({ value: fmt(n / 144), unit: "sq ft", formula: `${fmt(n)} sq in ÷ 144 = ${fmt(n / 144)} sq ft`, insert: fmt(n / 144) }) },
  { id: "sqyd_to_sqft", label: "Square Yards → Square Feet",
    run: (n) => ({ value: fmt(n * 9), unit: "sq ft", formula: `${fmt(n)} sq yd × 9 = ${fmt(n * 9)} sq ft`, insert: fmt(n * 9) }) },
  { id: "sqft_to_sqyd", label: "Square Feet → Square Yards",
    run: (n) => ({ value: fmt(n / 9), unit: "sq yd", formula: `${fmt(n)} sq ft ÷ 9 = ${fmt(n / 9)} sq yd`, insert: fmt(n / 9) }) },
  { id: "dia_to_rad", label: "Diameter → Radius",
    run: (n) => ({ value: fmt(n / 2), unit: "ft", formula: `${fmt(n)} ÷ 2 = ${fmt(n / 2)} ft`, insert: fmt(n / 2) }) },
  { id: "rad_to_dia", label: "Radius → Diameter",
    run: (n) => ({ value: fmt(n * 2), unit: "ft", formula: `${fmt(n)} × 2 = ${fmt(n * 2)} ft`, insert: fmt(n * 2) }) },
  { id: "dia_to_circ", label: "Diameter → Circumference",
    run: (n) => ({ value: fmt(n * Math.PI), unit: "ft", formula: `${fmt(n)} × π = ${fmt(n * Math.PI)} ft`, insert: fmt(n * Math.PI) }) },
  { id: "rad_to_circ", label: "Radius → Circumference",
    run: (n) => ({ value: fmt(2 * n * Math.PI), unit: "ft", formula: `2 × ${fmt(n)} × π = ${fmt(2 * n * Math.PI)} ft`, insert: fmt(2 * n * Math.PI) }) },
  { id: "ft_to_yd", label: "Feet → Yards",
    run: (n) => ({ value: fmt(n / 3), unit: "yd", formula: `${fmt(n)} ft ÷ 3 = ${fmt(n / 3)} yd`, insert: fmt(n / 3) }) },
  { id: "yd_to_ft", label: "Yards → Feet",
    run: (n) => ({ value: fmt(n * 3), unit: "ft", formula: `${fmt(n)} yd × 3 = ${fmt(n * 3)} ft`, insert: fmt(n * 3) }) },
  { id: "mm_to_in", label: "Millimeters → Inches",
    run: (n) => ({ value: fmt(n / 25.4), unit: "in", formula: `${fmt(n)} mm ÷ 25.4 = ${fmt(n / 25.4)} in`, insert: fmt(n / 25.4) }) },
  { id: "cm_to_in", label: "Centimeters → Inches",
    run: (n) => ({ value: fmt(n / 2.54), unit: "in", formula: `${fmt(n)} cm ÷ 2.54 = ${fmt(n / 2.54)} in`, insert: fmt(n / 2.54) }) },
  { id: "m_to_ft", label: "Meters → Feet",
    run: (n) => ({ value: fmt(n * 3.28084), unit: "ft", formula: `${fmt(n)} m × 3.28084 = ${fmt(n * 3.28084)} ft`, insert: fmt(n * 3.28084) }) },
  { id: "custom", label: "Custom Conversion", custom: true,
    run: (n, _w, _p, factor) => {
      const f = factor || 1;
      return { value: fmt(n * f), unit: "", formula: `${fmt(n)} × ${fmt(f)} = ${fmt(n * f)}`, insert: fmt(n * f) };
    } },
];
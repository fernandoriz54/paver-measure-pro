// Phase 2 guided configs: Patios, Walkways, Turf, Driveways, Borders.
// Reuses the same config shape as Phase 1 (guidedConfigs.js) so the shared
// GuidedMeasurement scaffold, verification engine, and review screen work
// without modification. Field-measured values stay authoritative; visual
// edits never change them.
import { Square, Footprints, Sprout, Car, Grid3x3 } from "lucide-react";
import { applyWaste, WASTE_OPTIONS, PRESET_PRODUCT_SIZES, BORDER_WIDTH_OPTIONS } from "@/lib/measurementUtils";
import {
  fmt, sectionsArea, avgWidth, circleAreaFromDiameter, ringArea, trapezoidArea,
  steppingSlabs, borderLinear, borderAreaFromLinear, netArea, row,
} from "@/lib/areaCalcUtils";

const opt = (key, label, extra = {}) => ({ key, label, optional: true, allowZero: true, ...extra });
const req = (key, label, why) => ({ key, label, why, optional: false });

// ============================ PATIOS ============================
const PATIO_TYPES = [
  { id: "rectangle", label: "Rectangle Patio", blurb: "One rectangle.", bestUse: "Standard rectangular patio.", difficulty: "Easy", diagram: "patioRect", preview: { length: 20, width: 10 }, requiredMeasurements: ["Length", "Width", "Diagonal (verify)"] },
  { id: "square", label: "Square Patio", blurb: "Equal sides.", bestUse: "A square slab or patio.", difficulty: "Easy", diagram: "patioRect", preview: { length: 12, width: 12 }, requiredMeasurements: ["Side length", "Diagonal (verify)"] },
  { id: "L", label: "L-Shaped Patio", blurb: "Two rectangles (A, B).", bestUse: "Patio wrapping a corner.", difficulty: "Medium", diagram: "patioL", preview: { sections: [{ length: 16, width: 10 }, { length: 10, width: 8 }] }, requiredMeasurements: ["Section A L×W", "Section B L×W", "Shared edge"] },
  { id: "U", label: "U-Shaped Patio", blurb: "Three rectangles (A, B, C).", bestUse: "Patio wrapping three sides.", difficulty: "Medium", diagram: "patioU", preview: { sections: [{ length: 12, width: 8 }, { length: 10, width: 8 }, { length: 12, width: 8 }] }, requiredMeasurements: ["3 sections L×W", "Shared edges"] },
  { id: "multi", label: "Multiple Connected", blurb: "Sections A, B, C and more.", bestUse: "Custom connected rectangles.", difficulty: "Complex", diagram: "patioMulti", preview: { sections: [{ length: 14, width: 10 }, { length: 8, width: 8 }, { length: 6, width: 6 }] }, requiredMeasurements: ["Each section L×W", "Shared edges"] },
  { id: "cutout", label: "Patio with Cutout", blurb: "Rectangle minus an inner rectangle.", bestUse: "Patio around an AC pad or tree.", difficulty: "Medium", diagram: "patioCutout", preview: { length: 20, width: 12, cutoutLength: 4, cutoutWidth: 3 }, requiredMeasurements: ["Outer L×W", "Cutout L×W"] },
  { id: "circular", label: "Patio with Circular Feature", blurb: "Rectangle plus/minus a circle.", bestUse: "Patio with a fire-pit ring or round planter.", difficulty: "Medium", diagram: "patioCircle", preview: { length: 18, width: 14, circleDiameter: 6 }, requiredMeasurements: ["L×W", "Circle diameter", "Add or subtract"] },
  { id: "walkwayConnect", label: "Patio Connected to Walkway", blurb: "Patio plus a linked walkway area.", bestUse: "Patio that flows into a walkway.", difficulty: "Medium", diagram: "patioRect", preview: { length: 16, width: 10, walkwayArea: 40 }, requiredMeasurements: ["Patio L×W", "Walkway area", "Shared edge"] },
  { id: "border", label: "Patio with Border", blurb: "Rectangle + a border course.", bestUse: "Patio with a contrasting border.", difficulty: "Medium", diagram: "patioRect", preview: { length: 18, width: 12, borderWidth: 8, borderRows: 1 }, requiredMeasurements: ["L×W", "Border width", "Border rows"] },
  { id: "freeform", label: "Freeform Divided into Sections", blurb: "Break into rectangles A, B, C…", bestUse: "Organic patio split into simple shapes.", difficulty: "Complex", diagram: "patioMulti", preview: { sections: [{ length: 10, width: 8 }, { length: 8, width: 6 }, { length: 6, width: 5 }] }, requiredMeasurements: ["Each section L×W", "Deductions"] },
];
const MULTI_PATIO = ["L", "U", "multi", "freeform"];

function patioHelp(field) {
  const map = {
    length: { where: "Longest side of the patio, end to end.", text: "Measure the full length along the longest edge.", example: "20 ft reads 20' 0\".", mistake: "Stopping short of a corner.", tool: "Measuring wheel" },
    width: { where: "Perpendicular to length, edge to edge.", text: "Measure the full width.", example: "10 ft reads 10' 0\".", mistake: "Measuring at an angle.", tool: "25 ft tape" },
    diagonal: { where: "Corner to opposite corner.", text: "Used to verify the patio is square.", example: "A 20×10 patio ≈ 22' 4\" diagonal.", mistake: "Measuring the wrong pair of corners.", tool: "100 ft tape" },
    sections: { where: "Each labeled rectangle's length and width.", text: "Color-coded A, B, C — don't overlap sections.", example: "Section A = 16×10, Section B = 10×8.", mistake: "Counting the shared corner twice.", tool: "25 ft tape" },
    cutoutLength: { where: "Length of the inner cutout (AC pad, tree).", text: "Subtracted from the gross rectangle.", example: "A 4×3 AC pad = 12 sq ft.", mistake: "Subtracting the pad perimeter instead of area.", tool: "Tape measure" },
    circleDiameter: { where: "Across the circular feature, through the center.", text: "Add for a round patio extension; subtract for a round deduction.", example: "A 6 ft fire pit = 6' 0\".", mistake: "Measuring radius and forgetting to double it.", tool: "Tape measure" },
    obstacles: { where: "Total area of obstacles on the patio (columns, drains).", text: "Subtracted from gross area.", example: "Two 2×2 columns = 8 sq ft.", mistake: "Subtracting obstacle perimeter.", tool: "Tape measure" },
    existingConcrete: { where: "Area of existing concrete to remain, inside the patio outline.", text: "Subtracted — no pavers installed there.", example: "A 5×4 pad = 20 sq ft.", mistake: "Including concrete outside the patio.", tool: "Tape measure" },
    borderWidth: { where: "Width of one border course.", text: "Used for border area and inside-edge length.", example: "An 8 in border.", mistake: "Forgetting to multiply by rows.", tool: "—" },
    waste: { where: "Extra material for cuts.", text: "10% standard, 12–15% for diagonal or curved.", example: "10%.", mistake: "0% on a diagonal layout.", tool: "—" },
  };
  return map[field] || null;
}

const patiosConfig = {
  id: "patios",
  title: "Patios",
  subtitle: "Area, sections, deductions & borders",
  icon: Square,
  typeChoices: PATIO_TYPES,
  expectedFields(typeId, v) {
    if (MULTI_PATIO.includes(typeId)) {
      return [req("sections", "Sections", "Each labeled rectangle's area is summed."), opt("obstacles", "Obstacle area"), opt("existingConcrete", "Existing concrete"), opt("waste", "Waste %")];
    }
    const base = [req("length", "Length", "Length times width gives the gross patio area."), req("width", "Width", "Width times length gives the gross patio area."), opt("diagonal", "Diagonal"), opt("obstacles", "Obstacle area"), opt("existingConcrete", "Existing concrete"), opt("waste", "Waste %"), opt("materialSize", "Material size")];
    if (typeId === "cutout") return [req("length", "Length"), req("width", "Width"), req("cutoutLength", "Cutout length"), req("cutoutWidth", "Cutout width"), opt("obstacles", "Obstacle area"), opt("waste", "Waste %")];
    if (typeId === "circular") return [req("length", "Length"), req("width", "Width"), req("circleDiameter", "Circle diameter"), opt("circleMode", "Circle mode"), opt("obstacles", "Obstacle area"), opt("waste", "Waste %")];
    if (typeId === "walkwayConnect") return [req("length", "Length"), req("width", "Width"), opt("walkwayArea", "Connected walkway area"), opt("sharedEdge", "Shared edge length"), opt("waste", "Waste %")];
    if (typeId === "border") return [req("length", "Length"), req("width", "Width"), opt("borderWidth", "Border width"), opt("borderRows", "Border rows"), opt("waste", "Waste %")];
    return base;
  },
  getSteps(typeId, v) {
    if (MULTI_PATIO.includes(typeId)) {
      const def = typeId === "L" ? 2 : typeId === "U" ? 3 : Math.max(2, (v.sections || []).length || 2);
      return [
        { id: "sections", question: "Enter each labeled section's length and width.", field: "sections", inputType: "sectionsArea", help: patioHelp("sections"), diagram: `patio${typeId === "L" ? "L" : typeId === "U" ? "U" : "Multi"}`, highlight: "sections" },
        { id: "obstacles", question: "Total obstacle area (columns, drains)? sq ft, 0 if none.", field: "obstacles", unit: "sq ft", inputType: "length", help: patioHelp("obstacles"), diagram: "patioMulti" },
        { id: "existingConcrete", question: "Existing concrete to remain? sq ft, 0 if none.", field: "existingConcrete", unit: "sq ft", inputType: "length", help: patioHelp("existingConcrete"), diagram: "patioMulti" },
        { id: "waste", question: "Waste %?", field: "waste", inputType: "select", options: WASTE_OPTIONS, help: patioHelp("waste"), diagram: "patioMulti" },
      ];
    }
    const common = [
      { id: "length", question: "Measure the patio length (longest side).", field: "length", unit: "ft", inputType: "length", help: patioHelp("length"), diagram: "patioRect", highlight: "length" },
      { id: "width", question: "Measure the patio width (perpendicular).", field: "width", unit: "ft", inputType: "length", help: patioHelp("width"), diagram: "patioRect", highlight: "width" },
    ];
    if (typeId === "cutout") {
      return [...common,
        { id: "cutoutLength", question: "Cutout length?", field: "cutoutLength", unit: "ft", inputType: "length", help: patioHelp("cutoutLength"), diagram: "patioCutout", highlight: "cutout" },
        { id: "cutoutWidth", question: "Cutout width?", field: "cutoutWidth", unit: "ft", inputType: "length", help: patioHelp("cutoutLength"), diagram: "patioCutout", highlight: "cutout" },
        { id: "waste", question: "Waste %?", field: "waste", inputType: "select", options: WASTE_OPTIONS, help: patioHelp("waste"), diagram: "patioCutout" },
      ];
    }
    if (typeId === "circular") {
      return [...common,
        { id: "circleDiameter", question: "Circle diameter?", field: "circleDiameter", unit: "ft", inputType: "length", help: patioHelp("circleDiameter"), diagram: "patioCircle", highlight: "circle" },
        { id: "circleMode", question: "Is the circle added or subtracted?", field: "circleMode", inputType: "select", options: [{ value: "subtract", label: "Subtract (deduction)" }, { value: "add", label: "Add (extension)" }], diagram: "patioCircle" },
        { id: "waste", question: "Waste %?", field: "waste", inputType: "select", options: WASTE_OPTIONS, help: patioHelp("waste"), diagram: "patioCircle" },
      ];
    }
    if (typeId === "walkwayConnect") {
      return [...common,
        { id: "walkwayArea", question: "Connected walkway area? sq ft, 0 if none.", field: "walkwayArea", unit: "sq ft", inputType: "length", diagram: "patioRect" },
        { id: "sharedEdge", question: "Shared edge length with walkway? ft, 0 if none.", field: "sharedEdge", unit: "ft", inputType: "length", diagram: "patioRect" },
        { id: "waste", question: "Waste %?", field: "waste", inputType: "select", options: WASTE_OPTIONS, help: patioHelp("waste"), diagram: "patioRect" },
      ];
    }
    if (typeId === "border") {
      return [...common,
        { id: "borderWidth", question: "Border width?", field: "borderWidth", inputType: "select", options: BORDER_WIDTH_OPTIONS, help: patioHelp("borderWidth"), diagram: "patioRect" },
        { id: "borderRows", question: "Border rows?", field: "borderRows", inputType: "integer", placeholder: "1", diagram: "patioRect" },
        { id: "waste", question: "Waste %?", field: "waste", inputType: "select", options: WASTE_OPTIONS, help: patioHelp("waste"), diagram: "patioRect" },
      ];
    }
    return [...common,
      { id: "diagonal", question: "Diagonal for square-up check? (optional, ft)", field: "diagonal", unit: "ft", inputType: "length", help: patioHelp("diagonal"), diagram: "patioRect", highlight: "diagonal" },
      { id: "obstacles", question: "Total obstacle area? sq ft, 0 if none.", field: "obstacles", unit: "sq ft", inputType: "length", help: patioHelp("obstacles"), diagram: "patioRect" },
      { id: "existingConcrete", question: "Existing concrete to remain? sq ft, 0 if none.", field: "existingConcrete", unit: "sq ft", inputType: "length", help: patioHelp("existingConcrete"), diagram: "patioRect" },
      { id: "materialSize", question: "Material size? (optional)", field: "materialSize", inputType: "select", options: PRESET_PRODUCT_SIZES.map((p) => ({ value: p.label, label: p.label })), diagram: "patioRect" },
      { id: "waste", question: "Waste %?", field: "waste", inputType: "select", options: WASTE_OPTIONS, help: patioHelp("waste"), diagram: "patioRect" },
    ];
  },
  verify(typeId, v, results) {
    const out = [];
    if (MULTI_PATIO.includes(typeId)) {
      const secs = v.sections || [];
      if (secs.length === 2 && secs[0].length === secs[1].length && secs[0].width === secs[1].width)
        out.push({ id: "dup_sections", severity: "warning", field: "sections", fixable: true, message: "Sections A and B are identical — confirm they don't overlap.", why: "Identical sections may be a duplicate entry.", howToVerify: "Confirm A and B are separate non-overlapping areas." });
    }
    if (typeId !== "walkwayConnect" && v.diagonal && v.length && v.width) {
      const expected = Math.sqrt((v.length) ** 2 + (v.width) ** 2);
      if (Math.abs(v.diagonal - expected) > 0.5) out.push({ id: "diag_mismatch", severity: "warning", field: "diagonal", fixable: true, message: "Diagonal doesn't match L×W — patio may be out of square.", why: `Expected ≈ ${fmt(expected)} ft.`, howToVerify: "Re-measure corner to opposite corner." });
    }
    if (results && results.deductions > results.gross) out.push({ id: "deduct_outside", severity: "error", field: "obstacles", fixable: true, message: "Deductions are larger than the patio.", why: "Net area went negative — a deduction may be outside the patio.", howToVerify: "Check obstacle/existing concrete area vs. gross area." });
    return out;
  },
  compute(typeId, v) {
    const waste = v.waste == null ? 10 : v.waste;
    let gross = 0, perimeter = 0, deductions = 0, sectionLabels = [];
    if (MULTI_PATIO.includes(typeId)) {
      const s = sectionsArea(v.sections);
      gross = s.area; perimeter = s.perimeter; sectionLabels = s.labels;
      deductions = (v.obstacles || 0) + (v.existingConcrete || 0);
    } else if (typeId === "cutout") {
      gross = (v.length || 0) * (v.width || 0);
      perimeter = 2 * ((v.length || 0) + (v.width || 0));
      deductions = (v.cutoutLength || 0) * (v.cutoutWidth || 0) + (v.obstacles || 0);
    } else if (typeId === "circular") {
      gross = (v.length || 0) * (v.width || 0);
      perimeter = 2 * ((v.length || 0) + (v.width || 0));
      const ca = circleAreaFromDiameter(v.circleDiameter || 0);
      if (v.circleMode === "add") gross += ca; else deductions += ca;
      deductions += v.obstacles || 0;
    } else if (typeId === "walkwayConnect") {
      gross = (v.length || 0) * (v.width || 0) + (v.walkwayArea || 0);
      perimeter = 2 * ((v.length || 0) + (v.width || 0)) - (v.sharedEdge || 0);
      deductions = 0;
    } else {
      gross = (v.length || 0) * (v.width || 0);
      perimeter = 2 * ((v.length || 0) + (v.width || 0));
      deductions = (v.obstacles || 0) + (v.existingConcrete || 0);
    }
    const net = netArea(gross, deductions);
    let borderLinearFt = 0, borderArea = 0;
    if (v.borderWidth && v.borderRows) {
      borderLinearFt = perimeter;
      borderArea = borderAreaFromLinear(borderLinearFt, v.borderWidth, v.borderRows);
    }
    const wasteCalc = applyWaste(net, waste);
    const reviewRows = [
      ...(sectionLabels.length ? sectionLabels.map((l) => row(`Section ${l.label} area`, l.area, "sq ft", "gross")) : (typeId === "walkwayConnect" ? [row("Patio area", (v.length || 0) * (v.width || 0), "sq ft", "gross"), row("Walkway area", v.walkwayArea || 0, "sq ft", "gross")] : [row("Gross area", gross, "sq ft", "gross")])),
      ...(deductions ? [row("Deductions", deductions, "sq ft", "deduct")] : []),
      row("Net area", net, "sq ft", "net"),
      row("Perimeter", perimeter, "lin ft", "linear"),
      ...(borderArea ? [row("Border area", borderArea, "sq ft", "gross"), row("Border linear", borderLinearFt, "lin ft", "linear")] : []),
      row("Material with waste", wasteCalc.total, "sq ft", "net"),
    ];
    const formulaSteps = [
      ...(sectionLabels.length ? sectionLabels.map((l) => `Section ${l.label} = ${fmt(l.area)} sq ft`) : [`Gross = ${fmt(gross)} sq ft`]),
      ...(deductions ? [`Deductions = ${fmt(deductions)} sq ft`] : []),
      `Net = ${fmt(gross)} − ${fmt(deductions)} = ${fmt(net)} sq ft`,
      `Perimeter = ${fmt(perimeter)} lin ft`,
      ...(borderArea ? [`Border = ${fmt(borderLinearFt)} × ${fmt((v.borderWidth || 0) / 12)} ft × ${v.borderRows} = ${fmt(borderArea)} sq ft`] : []),
      `Waste ${waste}% → +${fmt(wasteCalc.wasteAmount)} sq ft`,
      `Total material = ${fmt(wasteCalc.total)} sq ft`,
    ];
    return { gross, deductions, net, perimeter, borderLinear: borderLinearFt, borderArea, wastePercent: waste, wasteAmount: wasteCalc.wasteAmount, total: wasteCalc.total, reviewRows, formulaSteps };
  },
};

// ============================ WALKWAYS ============================
const WALKWAY_TYPES = [
  { id: "straight", label: "Straight Walkway", blurb: "One width, full length.", bestUse: "A simple straight path.", difficulty: "Easy", diagram: "walkwayStraight", preview: { centerlineLength: 24, startWidth: 4 }, requiredMeasurements: ["Centerline length", "Width"] },
  { id: "tapered", label: "Tapered Walkway", blurb: "Different start & end widths.", bestUse: "A path that widens or narrows.", difficulty: "Medium", diagram: "walkwayTapered", preview: { centerlineLength: 24, startWidth: 4, endWidth: 6 }, requiredMeasurements: ["Centerline length", "Start width", "End width"] },
  { id: "singleBend", label: "Single Bend", blurb: "One curve in the path.", bestUse: "A path that bends once.", difficulty: "Medium", diagram: "walkwayBend", preview: { centerlineLength: 30, startWidth: 4, endWidth: 4 }, requiredMeasurements: ["Centerline length", "Width", "Bend"] },
  { id: "scurve", label: "S-Curve", blurb: "Two opposite bends.", bestUse: "An S-shaped path.", difficulty: "Complex", diagram: "walkwayBend", preview: { centerlineLength: 36, startWidth: 5 }, requiredMeasurements: ["Centerline length", "Width", "Bends"] },
  { id: "freeform", label: "Freeform Path", blurb: "Multiple bends.", bestUse: "A winding garden path.", difficulty: "Complex", diagram: "walkwayBend", preview: { centerlineLength: 40, startWidth: 4 }, requiredMeasurements: ["Centerline length", "Widths"] },
  { id: "changingWidths", label: "Path with Changing Widths", blurb: "Width at several stations.", bestUse: "A path that varies in width along its length.", difficulty: "Complex", diagram: "walkwayTapered", preview: { centerlineLength: 30, widths: [4, 5, 6, 5] }, requiredMeasurements: ["Centerline length", "Widths", "Station spacing"] },
  { id: "withBorder", label: "Path with Border", blurb: "Walkway + border course.", bestUse: "A path with a contrasting border.", difficulty: "Medium", diagram: "walkwayStraight", preview: { centerlineLength: 24, startWidth: 4, borderWidth: 6 }, requiredMeasurements: ["Length", "Width", "Border width"] },
  { id: "steppingSlab", label: "Stepping-Slab Path", blurb: "Individual slabs with gaps.", bestUse: "A stepping-stone path.", difficulty: "Easy", diagram: "walkwayStepping", preview: { slabLengthIn: 24, slabWidthIn: 24, count: 8, gapIn: 3 }, requiredMeasurements: ["Slab size", "Count", "Gap"] },
  { id: "connectedPatio", label: "Walkway Connected to Patio", blurb: "Walkway plus patio area.", bestUse: "A walkway flowing onto a patio.", difficulty: "Medium", diagram: "walkwayStraight", preview: { centerlineLength: 18, startWidth: 4, walkwayArea: 72 }, requiredMeasurements: ["Length", "Width", "Patio area"] },
];
function walkwayHelp(field) {
  const map = {
    centerlineLength: { where: "Down the middle of the path, start to end.", text: "This is the authoritative length — use a measuring wheel along the centerline.", example: "A 24 ft path reads 24' 0\".", mistake: "Measuring along one edge instead of the center.", tool: "Measuring wheel" },
    startWidth: { where: "Across the path at the start, edge to edge.", text: "Perpendicular to the path direction.", example: "A 4 ft path reads 4' 0\".", mistake: "Measuring at an angle to the edge.", tool: "25 ft tape" },
    endWidth: { where: "Across the path at the end, edge to edge.", text: "For tapered paths.", example: "A 6 ft end reads 6' 0\".", mistake: "Using the start width for a tapered path.", tool: "25 ft tape" },
    widths: { where: "Width at each station along the path.", text: "Evenly spaced — average is used for area.", example: "4, 5, 6, 5 ft.", mistake: "Entering widths at uneven spacing.", tool: "25 ft tape" },
    borderWidth: { where: "Width of the border course on each side.", text: "Adds to total area.", example: "A 6 in border.", mistake: "Forgetting the border is on both sides.", tool: "—" },
    slabLengthIn: { where: "Length of one stepping slab, in inches.", text: "Used for slab area and run.", example: "A 24 in slab.", mistake: "Entering slab size in feet.", tool: "Tape measure" },
    gapIn: { where: "Gap between slabs, in inches.", text: "Affects total run only, not slab area.", example: "A 3 in gap.", mistake: "Counting the gap as slab area.", tool: "Tape measure" },
  };
  return map[field] || null;
}
const walkwaysConfig = {
  id: "walkways",
  title: "Walkways & Curved Paths",
  subtitle: "Centerline, widths, bends & slabs",
  icon: Footprints,
  typeChoices: WALKWAY_TYPES,
  expectedFields(typeId, v) {
    if (typeId === "steppingSlab") return [req("slabLengthIn", "Slab length (in)"), req("slabWidthIn", "Slab width (in)"), req("count", "Number of slabs"), opt("gapIn", "Gap (in)"), opt("rows", "Rows"), opt("waste", "Waste %")];
    if (typeId === "changingWidths") return [req("centerlineLength", "Centerline length"), req("widths", "Station widths"), opt("borderWidth", "Border width"), opt("waste", "Waste %")];
    const base = [req("centerlineLength", "Centerline length"), req("startWidth", "Start width")];
    if (typeId === "tapered") return [req("centerlineLength", "Centerline length"), req("startWidth", "Start width"), req("endWidth", "End width"), opt("borderWidth", "Border width"), opt("waste", "Waste %")];
    if (typeId === "withBorder" || typeId === "connectedPatio") return [...base, opt("borderWidth", "Border width"), opt("walkwayArea", "Connected area"), opt("waste", "Waste %")];
    return [...base, opt("borderWidth", "Border width"), opt("waste", "Waste %")];
  },
  getSteps(typeId, v) {
    if (typeId === "steppingSlab") {
      return [
        { id: "slabLengthIn", question: "Slab length? (inches)", field: "slabLengthIn", inputType: "integer", placeholder: "24", help: walkwayHelp("slabLengthIn"), diagram: "walkwayStepping", highlight: "slabLength" },
        { id: "slabWidthIn", question: "Slab width? (inches)", field: "slabWidthIn", inputType: "integer", placeholder: "24", help: walkwayHelp("slabLengthIn"), diagram: "walkwayStepping", highlight: "slabWidth" },
        { id: "count", question: "How many slabs?", field: "count", inputType: "integer", placeholder: "8", diagram: "walkwayStepping", highlight: "count" },
        { id: "gapIn", question: "Gap between slabs? (inches, 0 if none)", field: "gapIn", inputType: "integer", placeholder: "3", help: walkwayHelp("gapIn"), diagram: "walkwayStepping" },
        { id: "rows", question: "Rows? (1 = single file, 2 = double)", field: "rows", inputType: "integer", placeholder: "1", diagram: "walkwayStepping" },
        { id: "waste", question: "Waste %?", field: "waste", inputType: "select", options: WASTE_OPTIONS, diagram: "walkwayStepping" },
      ];
    }
    if (typeId === "changingWidths") {
      return [
        { id: "centerlineLength", question: "Measure the centerline length (start to end).", field: "centerlineLength", unit: "ft", inputType: "length", help: walkwayHelp("centerlineLength"), diagram: "walkwayTapered", highlight: "length" },
        { id: "widths", question: "Enter the width at each station (ft).", field: "widths", inputType: "widths", help: walkwayHelp("widths"), diagram: "walkwayTapered", highlight: "width" },
        { id: "borderWidth", question: "Border width? (optional)", field: "borderWidth", inputType: "select", options: BORDER_WIDTH_OPTIONS, help: walkwayHelp("borderWidth"), diagram: "walkwayTapered" },
        { id: "waste", question: "Waste %?", field: "waste", inputType: "select", options: WASTE_OPTIONS, diagram: "walkwayTapered" },
      ];
    }
    const isTapered = typeId === "tapered";
    const isBent = ["singleBend", "scurve", "freeform"].includes(typeId);
    return [
      { id: "centerlineLength", question: "Measure the centerline length (start to end).", field: "centerlineLength", unit: "ft", inputType: "length", help: walkwayHelp("centerlineLength"), diagram: isBent ? "walkwayBend" : "walkwayStraight", highlight: "length" },
      { id: "startWidth", question: "Width at the start?", field: "startWidth", unit: "ft", inputType: "length", help: walkwayHelp("startWidth"), diagram: isBent ? "walkwayBend" : isTapered ? "walkwayTapered" : "walkwayStraight", highlight: "width" },
      ...(isTapered ? [{ id: "endWidth", question: "Width at the end?", field: "endWidth", unit: "ft", inputType: "length", help: walkwayHelp("endWidth"), diagram: "walkwayTapered", highlight: "endWidth" }] : []),
      { id: "borderWidth", question: "Border width? (optional)", field: "borderWidth", inputType: "select", options: BORDER_WIDTH_OPTIONS, help: walkwayHelp("borderWidth"), diagram: "walkwayStraight" },
      { id: "waste", question: "Waste %?", field: "waste", inputType: "select", options: WASTE_OPTIONS, diagram: "walkwayStraight" },
    ];
  },
  verify(typeId, v, results) {
    const out = [];
    const w = v.startWidth || 0;
    if (w > 0 && w < 2) out.push({ id: "narrow", severity: "warning", field: "startWidth", fixable: true, message: "Walkway under 2 ft — unusually narrow.", why: "Narrow paths may not meet access needs.", howToVerify: "Re-measure the width." });
    if (typeId === "changingWidths" && (!v.widths || v.widths.length < 2)) out.push({ id: "widths_unverified", severity: "warning", field: "widths", fixable: true, message: "Changing-width path needs at least 2 station widths.", why: "A single width can't represent a changing path.", howToVerify: "Measure width at 2+ stations." });
    if (results && results.geometryEstimated != null && results.fieldArea > 0 && Math.abs(results.geometryEstimated - results.fieldArea) / results.fieldArea > 0.05)
      out.push({ id: "geom_vs_field", severity: "info", field: "centerlineLength", fixable: false, message: "Geometry estimate differs from field area — field area is used.", why: "Bends change the geometry estimate but not the authoritative length × average width.", howToVerify: "Field area stays correct regardless of bend." });
    return out;
  },
  compute(typeId, v) {
    const waste = v.waste == null ? 10 : v.waste;
    if (typeId === "steppingSlab") {
      const s = steppingSlabs({ slabLengthIn: v.slabLengthIn, slabWidthIn: v.slabWidthIn, count: v.count, gapIn: v.gapIn, rows: v.rows || 1 });
      const wasteCalc = applyWaste(s.totalSlabArea, waste);
      return {
        gross: s.totalSlabArea, deductions: 0, net: s.totalSlabArea, total: wasteCalc.total, wastePercent: waste, wasteAmount: wasteCalc.wasteAmount,
        totalRun: s.totalRun,
        reviewRows: [row("Slab area", s.slabArea, "sq ft", "gross"), row("Slab count", v.count || 0, "pcs", "count"), row("Total slab area", s.totalSlabArea, "sq ft", "gross"), row("Total run", s.totalRun, "ft", "linear"), row("Material with waste", wasteCalc.total, "sq ft", "net")],
        formulaSteps: [`Slab area = (${v.slabLengthIn || 0} × ${v.slabWidthIn || 0}) / 144 = ${fmt(s.slabArea)} sq ft`, `Total slab area = ${fmt(s.slabArea)} × ${v.count || 0} × ${v.rows || 1} = ${fmt(s.totalSlabArea)} sq ft`, `Total run = ${v.count || 0} × (${(v.slabLengthIn || 0) + (v.gapIn || 0)}) / 12 = ${fmt(s.totalRun)} ft`, `Waste ${waste}% → +${fmt(wasteCalc.wasteAmount)} sq ft`, `Total = ${fmt(wasteCalc.total)} sq ft`],
      };
    }
    const length = v.centerlineLength || 0;
    let widthsArr;
    if (typeId === "changingWidths") widthsArr = v.widths || [];
    else if (typeId === "tapered") widthsArr = [v.startWidth || 0, v.endWidth || 0];
    else widthsArr = [v.startWidth || 0];
    const aw = avgWidth(widthsArr);
    const fieldArea = length * aw;
    const geometryEstimated = fieldArea;
    let borderArea = 0, borderLinearFt = 0;
    if (v.borderWidth) { borderLinearFt = length * 2; borderArea = borderAreaFromLinear(borderLinearFt, v.borderWidth, 1); }
    const connectedArea = typeId === "connectedPatio" ? (v.walkwayArea || 0) : 0;
    const gross = fieldArea + connectedArea + borderArea;
    const net = gross;
    const wasteCalc = applyWaste(net, waste);
    return {
      gross, deductions: 0, net, fieldArea, geometryEstimated, avgWidth: aw, borderLinear: borderLinearFt, borderArea, total: wasteCalc.total, wastePercent: waste, wasteAmount: wasteCalc.wasteAmount,
      reviewRows: [row("Centerline length", length, "ft", "linear"), row("Average width", aw, "ft", "count"), row("Field area (length × avg width)", fieldArea, "sq ft", "gross"), ...(borderArea ? [row("Border area", borderArea, "sq ft", "gross")] : []), ...(connectedArea ? [row("Connected area", connectedArea, "sq ft", "gross")] : []), row("Material with waste", wasteCalc.total, "sq ft", "net")],
      formulaSteps: [`Average width = ${fmt(aw)} ft`, `Field area = ${fmt(length)} × ${fmt(aw)} = ${fmt(fieldArea)} sq ft (authoritative)`, ...(borderArea ? [`Border = ${fmt(borderLinearFt)} × ${fmt((v.borderWidth || 0) / 12)} = ${fmt(borderArea)} sq ft`] : []), `Waste ${waste}% → +${fmt(wasteCalc.wasteAmount)} sq ft`, `Total = ${fmt(wasteCalc.total)} sq ft`],
    };
  },
};

// ============================ TURF ============================
const TURF_TYPES = [
  { id: "rectangle", label: "Rectangle Lawn", blurb: "One rectangle.", bestUse: "Simple rectangular turf.", difficulty: "Easy", diagram: "turfRect", preview: { length: 20, width: 15 }, requiredMeasurements: ["Length", "Width", "Deductions"] },
  { id: "L", label: "L-Shaped Turf", blurb: "Two sections A, B.", bestUse: "Turf wrapping a corner.", difficulty: "Medium", diagram: "turfRect", preview: { sections: [{ length: 20, width: 10 }, { length: 12, width: 8 }] }, requiredMeasurements: ["Section A, B", "Deductions"] },
  { id: "multi", label: "Multiple Connected Areas", blurb: "Sections A, B, C.", bestUse: "Several turf patches.", difficulty: "Medium", diagram: "turfRect", preview: { sections: [{ length: 14, width: 10 }, { length: 8, width: 8 }] }, requiredMeasurements: ["Each section", "Deductions"] },
  { id: "curved", label: "Curved Lawn", blurb: "Freeform turf.", bestUse: "Organic lawn shape.", difficulty: "Complex", diagram: "turfRect", preview: { length: 25, width: 12 }, requiredMeasurements: ["Length × width (approx)", "Deductions"] },
  { id: "planterDeductions", label: "Turf with Planters", blurb: "Turf minus planter areas.", bestUse: "Lawn with planting beds.", difficulty: "Medium", diagram: "turfDeduct", preview: { length: 20, width: 15, planters: 30 }, requiredMeasurements: ["L×W", "Planter area"] },
  { id: "treeWells", label: "Turf with Tree Wells", blurb: "Turf minus tree rings.", bestUse: "Lawn with trees cut in.", difficulty: "Medium", diagram: "turfTreeWells", preview: { length: 20, width: 15, treeWellCount: 2, treeWellDiameter: 4 }, requiredMeasurements: ["L×W", "Tree count", "Tree diameter"] },
  { id: "steppingSlabs", label: "Turf with Stepping Slabs", blurb: "Slab path through turf.", bestUse: "Stepping stones in lawn.", difficulty: "Medium", diagram: "turfRect", preview: { length: 20, width: 15, slabArea: 32 }, requiredMeasurements: ["L×W", "Slab area"] },
  { id: "sideYard", label: "Side Yard", blurb: "Narrow strip.", bestUse: "A side-yard turf strip.", difficulty: "Easy", diagram: "turfRect", preview: { length: 30, width: 6 }, requiredMeasurements: ["Length", "Width"] },
  { id: "frontLawn", label: "Front Lawn", blurb: "Front yard turf.", bestUse: "Standard front lawn.", difficulty: "Easy", diagram: "turfRect", preview: { length: 25, width: 18 }, requiredMeasurements: ["L×W", "Deductions"] },
  { id: "backLawn", label: "Backyard Lawn", blurb: "Backyard turf.", bestUse: "Larger backyard lawn.", difficulty: "Easy", diagram: "turfRect", preview: { length: 30, width: 22 }, requiredMeasurements: ["L×W", "Deductions"] },
];
const MULTI_TURF = ["L", "multi"];
function turfHelp(field) {
  const map = {
    length: { where: "Longest side of the lawn.", text: "Gross turf length.", example: "20 ft reads 20' 0\".", mistake: "Stopping short of a curve.", tool: "Measuring wheel" },
    width: { where: "Perpendicular to length.", text: "Gross turf width.", example: "15 ft reads 15' 0\".", mistake: "Measuring at an angle.", tool: "25 ft tape" },
    sections: { where: "Each turf section's length and width.", text: "Summed for gross area.", example: "Section A = 20×10.", mistake: "Overlapping sections.", tool: "Tape measure" },
    planters: { where: "Total area of planters inside the turf.", text: "Subtracted from gross.", example: "30 sq ft of beds.", mistake: "Subtracting planter perimeter.", tool: "Tape measure" },
    treeWellCount: { where: "Number of tree wells in the turf.", text: "Each well is a circular deduction.", example: "2 trees.", mistake: "Counting the same tree twice.", tool: "Count by eye" },
    treeWellDiameter: { where: "Diameter of one tree well.", text: "Area = π × (d/2)².", example: "A 4 ft well ≈ 12.6 sq ft.", mistake: "Measuring radius not diameter.", tool: "Tape measure" },
    existingConcrete: { where: "Concrete to remain inside turf area.", text: "Subtracted.", example: "20 sq ft.", mistake: "Including concrete outside turf.", tool: "Tape measure" },
    slabArea: { where: "Total area of stepping slabs in the turf.", text: "Subtracted — no turf there.", example: "32 sq ft of slabs.", mistake: "Counting slabs as turf.", tool: "Tape measure" },
    paverBorderArea: { where: "Paver border area inside turf edge.", text: "Subtracted — pavers, not turf.", example: "40 sq ft border.", mistake: "Adding border to turf.", tool: "Tape measure" },
    metalEdging: { where: "Linear feet of metal edging.", text: "Reported separately, not an area.", example: "60 lin ft.", mistake: "Mixing edging linear with area.", tool: "Measuring wheel" },
  };
  return map[field] || null;
}
const turfConfig = {
  id: "turf",
  title: "Turf & Lawns",
  subtitle: "Gross, deductions, net & edging",
  icon: Sprout,
  typeChoices: TURF_TYPES,
  expectedFields(typeId, v) {
    if (MULTI_TURF.includes(typeId)) return [req("sections", "Sections"), opt("planters", "Planter area"), opt("existingConcrete", "Existing concrete"), opt("drains", "Drains area"), opt("acPads", "AC pad area"), opt("slabArea", "Stepping slab area"), opt("paverBorderArea", "Paver border area"), opt("metalEdging", "Metal edging (lin ft)"), opt("waste", "Waste %")];
    const base = [req("length", "Length"), req("width", "Width"), opt("planters", "Planter area"), opt("existingConcrete", "Existing concrete"), opt("drains", "Drains area"), opt("acPads", "AC pad area"), opt("slabArea", "Stepping slab area"), opt("paverBorderArea", "Paver border area"), opt("metalEdging", "Metal edging (lin ft)"), opt("waste", "Waste %")];
    if (typeId === "treeWells") return [req("length", "Length"), req("width", "Width"), req("treeWellCount", "Tree well count"), req("treeWellDiameter", "Tree well diameter"), opt("waste", "Waste %")];
    return base;
  },
  getSteps(typeId, v) {
    if (MULTI_TURF.includes(typeId)) {
      return [
        { id: "sections", question: "Enter each turf section's length and width.", field: "sections", inputType: "sectionsArea", help: turfHelp("sections"), diagram: "turfRect", highlight: "sections" },
        { id: "planters", question: "Planter area? sq ft, 0 if none.", field: "planters", unit: "sq ft", inputType: "length", help: turfHelp("planters"), diagram: "turfDeduct" },
        { id: "existingConcrete", question: "Existing concrete? sq ft, 0 if none.", field: "existingConcrete", unit: "sq ft", inputType: "length", help: turfHelp("existingConcrete"), diagram: "turfDeduct" },
        { id: "slabArea", question: "Stepping slab area? sq ft, 0 if none.", field: "slabArea", unit: "sq ft", inputType: "length", help: turfHelp("slabArea"), diagram: "turfRect" },
        { id: "paverBorderArea", question: "Paver border area? sq ft, 0 if none.", field: "paverBorderArea", unit: "sq ft", inputType: "length", help: turfHelp("paverBorderArea"), diagram: "turfRect" },
        { id: "metalEdging", question: "Metal edging? linear ft, 0 if none.", field: "metalEdging", unit: "lin ft", inputType: "length", help: turfHelp("metalEdging"), diagram: "turfRect" },
        { id: "waste", question: "Waste %?", field: "waste", inputType: "select", options: WASTE_OPTIONS, diagram: "turfRect" },
      ];
    }
    const common = [
      { id: "length", question: "Measure the lawn length.", field: "length", unit: "ft", inputType: "length", help: turfHelp("length"), diagram: "turfRect", highlight: "length" },
      { id: "width", question: "Measure the lawn width.", field: "width", unit: "ft", inputType: "length", help: turfHelp("width"), diagram: "turfRect", highlight: "width" },
    ];
    if (typeId === "treeWells") {
      return [...common,
        { id: "treeWellCount", question: "How many tree wells?", field: "treeWellCount", inputType: "integer", placeholder: "2", help: turfHelp("treeWellCount"), diagram: "turfTreeWells", highlight: "count" },
        { id: "treeWellDiameter", question: "Tree well diameter? (ft)", field: "treeWellDiameter", unit: "ft", inputType: "length", help: turfHelp("treeWellDiameter"), diagram: "turfTreeWells", highlight: "diameter" },
        { id: "waste", question: "Waste %?", field: "waste", inputType: "select", options: WASTE_OPTIONS, diagram: "turfTreeWells" },
      ];
    }
    return [...common,
      { id: "planters", question: "Planter area? sq ft, 0 if none.", field: "planters", unit: "sq ft", inputType: "length", help: turfHelp("planters"), diagram: "turfDeduct" },
      { id: "existingConcrete", question: "Existing concrete? sq ft, 0 if none.", field: "existingConcrete", unit: "sq ft", inputType: "length", help: turfHelp("existingConcrete"), diagram: "turfDeduct" },
      { id: "drains", question: "Drains area? sq ft, 0 if none.", field: "drains", unit: "sq ft", inputType: "length", diagram: "turfDeduct" },
      { id: "acPads", question: "AC pad area? sq ft, 0 if none.", field: "acPads", unit: "sq ft", inputType: "length", diagram: "turfDeduct" },
      { id: "slabArea", question: "Stepping slab area? sq ft, 0 if none.", field: "slabArea", unit: "sq ft", inputType: "length", help: turfHelp("slabArea"), diagram: "turfRect" },
      { id: "paverBorderArea", question: "Paver border area? sq ft, 0 if none.", field: "paverBorderArea", unit: "sq ft", inputType: "length", help: turfHelp("paverBorderArea"), diagram: "turfRect" },
      { id: "metalEdging", question: "Metal edging? linear ft, 0 if none.", field: "metalEdging", unit: "lin ft", inputType: "length", help: turfHelp("metalEdging"), diagram: "turfRect" },
      { id: "waste", question: "Waste %?", field: "waste", inputType: "select", options: WASTE_OPTIONS, diagram: "turfRect" },
    ];
  },
  verify(typeId, v, results) {
    const out = [];
    if (results && results.deductions > results.gross) out.push({ id: "deduct_outside", severity: "error", field: "planters", fixable: true, message: "Deductions are larger than the turf area.", why: "A deduction may be outside the turf.", howToVerify: "Check each deduction vs. gross turf area." });
    if ((v.width || 0) > 0 && v.width < 3) out.push({ id: "narrow", severity: "warning", field: "width", fixable: true, message: "Turf under 3 ft wide — narrow section.", why: "Narrow strips are hard to seam.", howToVerify: "Re-measure the width." });
    if ((v.paverBorderArea || 0) > 0 && (v.metalEdging || 0) > 0) out.push({ id: "border_edging_conflict", severity: "warning", field: "paverBorderArea", fixable: true, message: "Both a paver border and metal edging entered.", why: "A border and edging usually serve the same edge — one may be redundant.", howToVerify: "Confirm which edges get which treatment." });
    return out;
  },
  compute(typeId, v) {
    const waste = v.waste == null ? 10 : v.waste;
    let gross = 0, perimeter = 0;
    if (MULTI_TURF.includes(typeId)) { const s = sectionsArea(v.sections); gross = s.area; perimeter = s.perimeter; }
    else { gross = (v.length || 0) * (v.width || 0); perimeter = 2 * ((v.length || 0) + (v.width || 0)); }
    let treeWellArea = 0;
    if (typeId === "treeWells") treeWellArea = (v.treeWellCount || 0) * circleAreaFromDiameter(v.treeWellDiameter || 0);
    const deductions = (v.planters || 0) + (v.existingConcrete || 0) + (v.drains || 0) + (v.acPads || 0) + (v.slabArea || 0) + (v.paverBorderArea || 0) + treeWellArea;
    const net = netArea(gross, deductions);
    const wasteCalc = applyWaste(net, waste);
    const treeWellCount = typeId === "treeWells" ? (v.treeWellCount || 0) : 0;
    return {
      gross, deductions, net, perimeter, edgingLinear: v.metalEdging || 0, borderArea: v.paverBorderArea || 0, treeWellCount, total: wasteCalc.total, wastePercent: waste, wasteAmount: wasteCalc.wasteAmount,
      reviewRows: [row("Gross turf area", gross, "sq ft", "gross"), ...(deductions ? [row("Active deductions", deductions, "sq ft", "deduct")] : []), row("Net turf area", net, "sq ft", "net"), row("Waste", wasteCalc.wasteAmount, "sq ft", "deduct"), row("Final order area", wasteCalc.total, "sq ft", "net"), row("Edging linear", v.metalEdging || 0, "lin ft", "linear"), ...(v.paverBorderArea ? [row("Border area", v.paverBorderArea, "sq ft", "gross")] : []), ...(treeWellCount ? [row("Tree wells", treeWellCount, "count", "count")] : [])],
      formulaSteps: [`Gross = ${fmt(gross)} sq ft`, `Deductions = ${fmt(deductions)} sq ft`, `Net = ${fmt(gross)} − ${fmt(deductions)} = ${fmt(net)} sq ft`, `Waste ${waste}% → +${fmt(wasteCalc.wasteAmount)} sq ft`, `Final order = ${fmt(wasteCalc.total)} sq ft`],
    };
  },
};

// ============================ DRIVEWAYS ============================
const DRIVEWAY_TYPES = [
  { id: "standard", label: "Standard Rectangle", blurb: "One width, one depth.", bestUse: "A simple rectangular driveway.", difficulty: "Easy", diagram: "drivewayStd", preview: { garageWidth: 16, mainDepth: 20 }, requiredMeasurements: ["Garage width", "Main depth"] },
  { id: "tapered", label: "Tapered Driveway", blurb: "Different garage & street widths.", bestUse: "A driveway that flares to the street.", difficulty: "Medium", diagram: "drivewayTapered", preview: { garageWidth: 16, streetWidth: 22, mainDepth: 24 }, requiredMeasurements: ["Garage width", "Street width", "Depth"] },
  { id: "apron", label: "Driveway with Apron", blurb: "Main slab + street apron.", bestUse: "A driveway with a concrete apron section.", difficulty: "Medium", diagram: "drivewayApron", preview: { garageWidth: 16, mainDepth: 20, apronLength: 6, apronWidth: 22 }, requiredMeasurements: ["Main L×W", "Apron L×W"] },
  { id: "flare", label: "Driveway with Garage Flare", blurb: "Flared edges near garage.", bestUse: "A driveway that widens at the garage.", difficulty: "Medium", diagram: "drivewayTapered", preview: { garageWidth: 20, streetWidth: 16, mainDepth: 22 }, requiredMeasurements: ["Garage width", "Street width", "Depth"] },
  { id: "L", label: "L-Shaped Driveway", blurb: "Two sections A, B.", bestUse: "A driveway that turns a corner.", difficulty: "Medium", diagram: "drivewayL", preview: { sections: [{ length: 20, width: 16 }, { length: 12, width: 10 }] }, requiredMeasurements: ["Section A, B", "Shared edge"] },
  { id: "circular", label: "Circular Driveway", blurb: "Loop driveway.", bestUse: "A circular or oval drive.", difficulty: "Complex", diagram: "drivewayStd", preview: { outerDiameter: 40, driveWidth: 10 }, requiredMeasurements: ["Outer diameter", "Drive width"] },
  { id: "withWalkway", label: "Driveway with Walkway", blurb: "Driveway plus walkway area.", bestUse: "A driveway connected to a walkway.", difficulty: "Medium", diagram: "drivewayStd", preview: { garageWidth: 16, mainDepth: 20, walkwayArea: 60 }, requiredMeasurements: ["Main L×W", "Walkway area"] },
  { id: "withBorder", label: "Driveway with Border", blurb: "Driveway + border course.", bestUse: "A driveway with a border.", difficulty: "Medium", diagram: "drivewayStd", preview: { garageWidth: 16, mainDepth: 20, borderWidth: 8 }, requiredMeasurements: ["Main L×W", "Border width"] },
  { id: "multi", label: "Multiple Connected Sections", blurb: "Sections A, B, C.", bestUse: "A custom multi-section driveway.", difficulty: "Complex", diagram: "drivewayL", preview: { sections: [{ length: 18, width: 14 }, { length: 10, width: 8 }, { length: 8, width: 8 }] }, requiredMeasurements: ["Each section", "Shared edges"] },
];
const MULTI_DRIVE = ["L", "multi"];
function drivewayHelp(field) {
  const map = {
    garageWidth: { where: "Width at the garage face.", text: "Where the driveway meets the garage.", example: "A 2-car driveway ≈ 16 ft.", mistake: "Measuring at the street instead.", tool: "Measuring wheel" },
    streetWidth: { where: "Width at the street/curb.", text: "Used for the trapezoid average.", example: "22 ft at the street.", mistake: "Using garage width for a tapered drive.", tool: "Measuring wheel" },
    mainDepth: { where: "From garage to street, perpendicular.", text: "The depth of the main slab.", example: "20 ft deep.", mistake: "Measuring along the slope.", tool: "Measuring wheel" },
    apronLength: { where: "Length of the apron section along the street.", text: "Added to the main slab.", example: "A 6 ft apron.", mistake: "Counting the apron in the main depth too.", tool: "Tape measure" },
    apronWidth: { where: "Width of the apron along the street.", text: "Apron area = length × width.", example: "22 ft wide apron.", mistake: "Using garage width for the apron.", tool: "Measuring wheel" },
    sections: { where: "Each driveway section's length and width.", text: "Color-coded A, B, C.", example: "Section A = 20×16.", mistake: "Double-counting the shared edge.", tool: "Measuring wheel" },
    drainage: { where: "Any drainage feature (trench, channel).", text: "Mark as verified if checked.", example: "A trench drain.", mistake: "Ignoring drainage in the layout.", tool: "—" },
  };
  return map[field] || null;
}
const drivewaysConfig = {
  id: "driveways",
  title: "Driveways",
  subtitle: "Garage, street, apron & flares",
  icon: Car,
  typeChoices: DRIVEWAY_TYPES,
  expectedFields(typeId, v) {
    if (MULTI_DRIVE.includes(typeId)) return [req("sections", "Sections"), opt("borderWidth", "Border width"), opt("waste", "Waste %")];
    if (typeId === "circular") return [req("outerDiameter", "Outer diameter"), req("driveWidth", "Drive width"), opt("waste", "Waste %")];
    const base = [req("garageWidth", "Garage width"), req("mainDepth", "Main depth")];
    if (typeId === "tapered" || typeId === "flare") return [req("garageWidth", "Garage width"), req("streetWidth", "Street width"), req("mainDepth", "Main depth"), opt("waste", "Waste %")];
    if (typeId === "apron") return [req("garageWidth", "Garage width"), req("mainDepth", "Main depth"), req("apronLength", "Apron length"), req("apronWidth", "Apron width"), opt("waste", "Waste %")];
    return [...base, opt("borderWidth", "Border width"), opt("walkwayArea", "Walkway area"), opt("drainage", "Drainage verified"), opt("waste", "Waste %")];
  },
  getSteps(typeId, v) {
    if (MULTI_DRIVE.includes(typeId)) {
      return [
        { id: "sections", question: "Enter each driveway section's length and width.", field: "sections", inputType: "sectionsArea", help: drivewayHelp("sections"), diagram: "drivewayL", highlight: "sections" },
        { id: "borderWidth", question: "Border width? (optional)", field: "borderWidth", inputType: "select", options: BORDER_WIDTH_OPTIONS, diagram: "drivewayL" },
        { id: "waste", question: "Waste %?", field: "waste", inputType: "select", options: WASTE_OPTIONS, diagram: "drivewayL" },
      ];
    }
    if (typeId === "circular") {
      return [
        { id: "outerDiameter", question: "Outer diameter of the loop? (ft)", field: "outerDiameter", unit: "ft", inputType: "length", diagram: "drivewayStd", highlight: "length" },
        { id: "driveWidth", question: "Drive width? (ft)", field: "driveWidth", unit: "ft", inputType: "length", diagram: "drivewayStd", highlight: "width" },
        { id: "waste", question: "Waste %?", field: "waste", inputType: "select", options: WASTE_OPTIONS, diagram: "drivewayStd" },
      ];
    }
    const common = [
      { id: "garageWidth", question: "Width at the garage?", field: "garageWidth", unit: "ft", inputType: "length", help: drivewayHelp("garageWidth"), diagram: typeId === "tapered" || typeId === "flare" ? "drivewayTapered" : "drivewayStd", highlight: "garageWidth" },
      { id: "mainDepth", question: "Depth from garage to street?", field: "mainDepth", unit: "ft", inputType: "length", help: drivewayHelp("mainDepth"), diagram: typeId === "tapered" || typeId === "flare" ? "drivewayTapered" : "drivewayStd", highlight: "depth" },
    ];
    if (typeId === "tapered" || typeId === "flare") {
      return [
        { id: "garageWidth", question: "Width at the garage?", field: "garageWidth", unit: "ft", inputType: "length", help: drivewayHelp("garageWidth"), diagram: "drivewayTapered", highlight: "garageWidth" },
        { id: "streetWidth", question: "Width at the street?", field: "streetWidth", unit: "ft", inputType: "length", help: drivewayHelp("streetWidth"), diagram: "drivewayTapered", highlight: "streetWidth" },
        { id: "mainDepth", question: "Depth (garage to street)?", field: "mainDepth", unit: "ft", inputType: "length", help: drivewayHelp("mainDepth"), diagram: "drivewayTapered", highlight: "depth" },
        { id: "waste", question: "Waste %?", field: "waste", inputType: "select", options: WASTE_OPTIONS, diagram: "drivewayTapered" },
      ];
    }
    if (typeId === "apron") {
      return [...common,
        { id: "apronLength", question: "Apron length (along street)?", field: "apronLength", unit: "ft", inputType: "length", help: drivewayHelp("apronLength"), diagram: "drivewayApron", highlight: "apronLength" },
        { id: "apronWidth", question: "Apron width (along street)?", field: "apronWidth", unit: "ft", inputType: "length", help: drivewayHelp("apronWidth"), diagram: "drivewayApron", highlight: "apronWidth" },
        { id: "waste", question: "Waste %?", field: "waste", inputType: "select", options: WASTE_OPTIONS, diagram: "drivewayApron" },
      ];
    }
    return [...common,
      { id: "borderWidth", question: "Border width? (optional)", field: "borderWidth", inputType: "select", options: BORDER_WIDTH_OPTIONS, diagram: "drivewayStd" },
      { id: "walkwayArea", question: "Connected walkway area? sq ft, 0 if none.", field: "walkwayArea", unit: "sq ft", inputType: "length", diagram: "drivewayStd" },
      { id: "drainage", question: "Is drainage verified?", field: "drainage", inputType: "select", options: [{ value: "no", label: "Not yet" }, { value: "yes", label: "Verified" }], help: drivewayHelp("drainage"), diagram: "drivewayStd" },
      { id: "waste", question: "Waste %?", field: "waste", inputType: "select", options: WASTE_OPTIONS, diagram: "drivewayStd" },
    ];
  },
  verify(typeId, v, results) {
    const out = [];
    if ((typeId === "tapered" || typeId === "flare") && v.garageWidth && v.streetWidth && Math.abs(v.garageWidth - v.streetWidth) > 12)
      out.push({ id: "big_taper", severity: "warning", field: "streetWidth", fixable: true, message: "Garage and street widths differ by over 12 ft — confirm the taper.", why: "A large difference may be a measurement error.", howToVerify: "Re-measure both widths." });
    if (typeId === "apron" && (v.apronLength || 0) > 0 && (v.mainDepth || 0) > 0 && v.apronLength > v.mainDepth)
      out.push({ id: "apron_double", severity: "warning", field: "apronLength", fixable: true, message: "Apron length exceeds main depth — apron may be counted twice.", why: "If the apron is inside the main depth, don't add it again.", howToVerify: "Confirm the apron is separate from the main slab." });
    if (v.drainage === "no") out.push({ id: "drainage_unverified", severity: "warning", field: "drainage", fixable: true, message: "Drainage feature not verified.", why: "Drainage affects driveway slope and cuts.", howToVerify: "Inspect and mark drainage as verified." });
    if (results && results.deductions > results.gross) out.push({ id: "deduct_outside", severity: "error", field: "deductions", fixable: true, message: "Deductions are larger than the driveway.", why: "A deduction may be outside the driveway.", howToVerify: "Check deductions vs. gross area." });
    return out;
  },
  compute(typeId, v) {
    const waste = v.waste == null ? 10 : v.waste;
    let gross = 0, perimeter = 0, deductions = 0;
    if (MULTI_DRIVE.includes(typeId)) { const s = sectionsArea(v.sections); gross = s.area; perimeter = s.perimeter; }
    else if (typeId === "circular") {
      const outer = circleAreaFromDiameter(v.outerDiameter || 0);
      const inner = circleAreaFromDiameter(Math.max(0, (v.outerDiameter || 0) - 2 * (v.driveWidth || 0)));
      gross = outer - inner; perimeter = Math.PI * (v.outerDiameter || 0);
    } else if (typeId === "tapered" || typeId === "flare") {
      gross = trapezoidArea(v.garageWidth, v.streetWidth, v.mainDepth);
      perimeter = (v.garageWidth || 0) + (v.streetWidth || 0) + 2 * (v.mainDepth || 0);
    } else if (typeId === "apron") {
      const main = (v.garageWidth || 0) * (v.mainDepth || 0);
      const apron = (v.apronLength || 0) * (v.apronWidth || 0);
      gross = main + apron; perimeter = 2 * ((v.garageWidth || 0) + (v.mainDepth || 0)) + (v.apronWidth || 0);
    } else {
      gross = (v.garageWidth || 0) * (v.mainDepth || 0);
      perimeter = 2 * ((v.garageWidth || 0) + (v.mainDepth || 0));
      gross += v.walkwayArea || 0;
    }
    let borderArea = 0, borderLinearFt = 0;
    if (v.borderWidth) { borderLinearFt = perimeter; borderArea = borderAreaFromLinear(borderLinearFt, v.borderWidth, 1); }
    const net = netArea(gross, deductions);
    const wasteCalc = applyWaste(net, waste);
    return {
      gross, deductions, net, perimeter, borderLinear: borderLinearFt, borderArea, total: wasteCalc.total, wastePercent: waste, wasteAmount: wasteCalc.wasteAmount,
      reviewRows: [row("Gross driveway area", gross, "sq ft", "gross"), row("Net area", net, "sq ft", "net"), row("Perimeter", perimeter, "lin ft", "linear"), ...(borderArea ? [row("Border area", borderArea, "sq ft", "gross"), row("Border linear", borderLinearFt, "lin ft", "linear")] : []), row("Material with waste", wasteCalc.total, "sq ft", "net")],
      formulaSteps: [`Gross = ${fmt(gross)} sq ft`, `Net = ${fmt(net)} sq ft`, `Perimeter = ${fmt(perimeter)} lin ft`, ...(borderArea ? [`Border = ${fmt(borderArea)} sq ft`] : []), `Waste ${waste}% → +${fmt(wasteCalc.wasteAmount)} sq ft`, `Total = ${fmt(wasteCalc.total)} sq ft`],
    };
  },
};

// ============================ BORDERS ============================
const BORDER_TYPES = [
  { id: "singleRunning", label: "Single Running Border", blurb: "One row around an edge.", bestUse: "A standard single border.", difficulty: "Easy", diagram: "borderRun", preview: { totalRun: 60, borderWidth: 8, rows: 1 }, requiredMeasurements: ["Total run", "Border width"] },
  { id: "double", label: "Double Border", blurb: "Two rows.", bestUse: "A wider two-row border.", difficulty: "Easy", diagram: "borderDouble", preview: { totalRun: 60, borderWidth: 8, rows: 2 }, requiredMeasurements: ["Total run", "Border width", "Rows"] },
  { id: "soldier", label: "Soldier Course", blurb: "Long edge facing out.", bestUse: "A soldier-course border.", difficulty: "Medium", diagram: "borderRun", preview: { totalRun: 60, borderWidth: 6, rows: 1 }, requiredMeasurements: ["Total run", "Unit length"] },
  { id: "sailor", label: "Sailor Course", blurb: "Short edge facing out.", bestUse: "A sailor-course border.", difficulty: "Medium", diagram: "borderRun", preview: { totalRun: 60, borderWidth: 4, rows: 1 }, requiredMeasurements: ["Total run", "Unit width"] },
  { id: "circular", label: "Circular Border", blurb: "Ring around a circle.", bestUse: "A round fire-pit or tree border.", difficulty: "Complex", diagram: "borderCircular", preview: { innerDiameter: 6, outerDiameter: 8 }, requiredMeasurements: ["Inner diameter", "Outer diameter"] },
  { id: "curved", label: "Curved Border", blurb: "Border along a curve.", bestUse: "A border following a curved edge.", difficulty: "Complex", diagram: "borderRun", preview: { totalRun: 48, borderWidth: 6, rows: 1 }, requiredMeasurements: ["Total run", "Border width"] },
  { id: "interiorRing", label: "Interior Ring", blurb: "Border inside a field.", bestUse: "An inlay ring inside a patio.", difficulty: "Complex", diagram: "borderCircular", preview: { innerDiameter: 4, outerDiameter: 6 }, requiredMeasurements: ["Inner diameter", "Outer diameter"] },
  { id: "treeWell", label: "Tree-Well Border", blurb: "Ring around a tree.", bestUse: "A border around a tree well.", difficulty: "Medium", diagram: "borderCircular", preview: { innerDiameter: 3, outerDiameter: 4 }, requiredMeasurements: ["Inner diameter", "Outer diameter"] },
  { id: "metalEdging", label: "Metal Edging", blurb: "Edging only, no pavers.", bestUse: "A clean metal-edge separation.", difficulty: "Easy", diagram: "borderRun", preview: { totalRun: 60 }, requiredMeasurements: ["Total run"] },
  { id: "aroundTurf", label: "Border Around Turf", blurb: "Paver border beside turf.", bestUse: "A border separating turf and pavers.", difficulty: "Medium", diagram: "borderRun", preview: { totalRun: 50, borderWidth: 8, rows: 1 }, requiredMeasurements: ["Total run", "Border width"] },
  { id: "partial", label: "Partial Border", blurb: "Border on some edges.", bestUse: "A border on only part of the perimeter.", difficulty: "Medium", diagram: "borderRun", preview: { totalRun: 60, noBorderEdges: 12, borderWidth: 6 }, requiredMeasurements: ["Total run", "No-border edges"] },
  { id: "shared", label: "Shared Border Between Materials", blurb: "Edge shared by two areas.", bestUse: "One border serves two areas.", difficulty: "Medium", diagram: "borderRun", preview: { totalRun: 60, sharedEdges: 20, borderWidth: 6 }, requiredMeasurements: ["Total run", "Shared edges"] },
];
const CIRCULAR_BORDERS = ["circular", "interiorRing", "treeWell"];
function borderHelp(field) {
  const map = {
    totalRun: { where: "Total length of the edge being bordered.", text: "Use a measuring wheel along the edge.", example: "60 ft reads 60' 0\".", mistake: "Measuring the area instead of the edge.", tool: "Measuring wheel" },
    borderWidth: { where: "Width of one border course, in inches.", text: "Used for border area and inside-edge length.", example: "An 8 in border.", mistake: "Leaving width at 0 but entering rows.", tool: "—" },
    rows: { where: "Number of border rows.", text: "Single = 1, double = 2.", example: "1 row.", mistake: "Counting a corner as a row.", tool: "—" },
    innerDiameter: { where: "Inside diameter of the ring.", text: "The inner edge of the border.", example: "A 6 ft inner ring.", mistake: "Measuring radius not diameter.", tool: "Tape measure" },
    outerDiameter: { where: "Outside diameter of the ring.", text: "The outer edge of the border.", example: "An 8 ft outer ring.", mistake: "Confusing with inner diameter.", tool: "Tape measure" },
    sharedEdges: { where: "Edges shared with another bordered area.", text: "Subtracted so the border isn't counted twice.", example: "A 20 ft shared edge.", mistake: "Bordering the shared edge on both sides.", tool: "Tape measure" },
    noBorderEdges: { where: "Edges with no border needed.", text: "Subtracted from the total run.", example: "A 12 ft gap with no border.", mistake: "Bordering an edge that needs none.", tool: "—" },
    corners: { where: "Number of corners the border turns.", text: "Corners need corner pieces.", example: "4 corners on a rectangle.", mistake: "Counting a curve as a corner.", tool: "Count by eye" },
  };
  return map[field] || null;
}
const bordersConfig = {
  id: "borders",
  title: "Borders & Edging",
  subtitle: "Linear run, rows, rings & units",
  icon: Grid3x3,
  typeChoices: BORDER_TYPES,
  expectedFields(typeId, v) {
    if (CIRCULAR_BORDERS.includes(typeId)) return [req("innerDiameter", "Inner diameter"), req("outerDiameter", "Outer diameter"), opt("waste", "Waste %")];
    const base = [req("totalRun", "Total run"), opt("borderWidth", "Border width"), opt("rows", "Rows"), opt("unitLength", "Unit length (in)"), opt("corners", "Corners"), opt("sharedEdges", "Shared edges"), opt("noBorderEdges", "No-border edges"), opt("waste", "Waste %")];
    if (typeId === "metalEdging") return [req("totalRun", "Total run")];
    return base;
  },
  getSteps(typeId, v) {
    if (CIRCULAR_BORDERS.includes(typeId)) {
      return [
        { id: "innerDiameter", question: "Inner diameter? (ft)", field: "innerDiameter", unit: "ft", inputType: "length", help: borderHelp("innerDiameter"), diagram: "borderCircular", highlight: "inner" },
        { id: "outerDiameter", question: "Outer diameter? (ft)", field: "outerDiameter", unit: "ft", inputType: "length", help: borderHelp("outerDiameter"), diagram: "borderCircular", highlight: "outer" },
        { id: "waste", question: "Waste %?", field: "waste", inputType: "select", options: WASTE_OPTIONS, diagram: "borderCircular" },
      ];
    }
    if (typeId === "metalEdging") {
      return [{ id: "totalRun", question: "Total edging run? (linear ft)", field: "totalRun", unit: "lin ft", inputType: "length", help: borderHelp("totalRun"), diagram: "borderRun", highlight: "run" }];
    }
    return [
      { id: "totalRun", question: "Total run to border? (linear ft)", field: "totalRun", unit: "lin ft", inputType: "length", help: borderHelp("totalRun"), diagram: typeId === "double" ? "borderDouble" : "borderRun", highlight: "run" },
      { id: "borderWidth", question: "Border width?", field: "borderWidth", inputType: "select", options: BORDER_WIDTH_OPTIONS, help: borderHelp("borderWidth"), diagram: "borderRun" },
      { id: "rows", question: "How many rows?", field: "rows", inputType: "integer", placeholder: "1", help: borderHelp("rows"), diagram: typeId === "double" ? "borderDouble" : "borderRun" },
      { id: "unitLength", question: "Unit length? (inches, 0 to skip piece count)", field: "unitLength", inputType: "integer", placeholder: "0", diagram: "borderRun" },
      { id: "corners", question: "How many corners?", field: "corners", inputType: "integer", placeholder: "4", help: borderHelp("corners"), diagram: "borderRun" },
      { id: "sharedEdges", question: "Shared edges to exclude? (lin ft, 0 if none)", field: "sharedEdges", unit: "lin ft", inputType: "length", help: borderHelp("sharedEdges"), diagram: "borderRun" },
      { id: "noBorderEdges", question: "Edges with no border? (lin ft, 0 if none)", field: "noBorderEdges", unit: "lin ft", inputType: "length", help: borderHelp("noBorderEdges"), diagram: "borderRun" },
      { id: "waste", question: "Waste %?", field: "waste", inputType: "select", options: WASTE_OPTIONS, diagram: "borderRun" },
    ];
  },
  verify(typeId, v, results) {
    const out = [];
    if (!CIRCULAR_BORDERS.includes(typeId) && typeId !== "metalEdging") {
      const eff = borderLinear({ totalRun: v.totalRun, sharedEdges: v.sharedEdges, noBorderEdges: v.noBorderEdges });
      if (eff <= 0 && v.totalRun) out.push({ id: "shared_too_big", severity: "error", field: "sharedEdges", fixable: true, message: "Shared + no-border edges exceed the total run.", why: "The effective border length is zero or negative.", howToVerify: "Check shared and no-border edge totals." });
      if ((v.rows || 0) > 0 && !(v.borderWidth || 0)) out.push({ id: "no_width", severity: "warning", field: "borderWidth", fixable: true, message: "Border rows entered with no border width.", why: "Border area needs a width.", howToVerify: "Select a border width." });
      if ((typeId === "curved" || typeId === "circular") && (v.unitLength || 0) > 0) out.push({ id: "curved_units", severity: "warning", field: "unitLength", fixable: true, message: "Curved border with rigid units — units will need cutting.", why: "Curves need cut pieces at the joints.", howToVerify: "Allow extra waste for curved cuts." });
    }
    if (CIRCULAR_BORDERS.includes(typeId) && v.innerDiameter && v.outerDiameter && v.outerDiameter <= v.innerDiameter)
      out.push({ id: "ring_inverted", severity: "error", field: "outerDiameter", fixable: true, message: "Outer diameter must be larger than the inner diameter.", why: "The ring area would be negative.", howToVerify: "Re-measure inner and outer diameters." });
    return out;
  },
  compute(typeId, v) {
    const waste = v.waste == null ? 10 : v.waste;
    if (typeId === "metalEdging") {
      return { gross: 0, deductions: 0, net: 0, borderLinear: v.totalRun || 0, borderArea: 0, total: 0, wastePercent: 0, wasteAmount: 0,
        reviewRows: [row("Edging linear", v.totalRun || 0, "lin ft", "linear")],
        formulaSteps: [`Edging = ${fmt(v.totalRun || 0)} lin ft`] };
    }
    if (CIRCULAR_BORDERS.includes(typeId)) {
      const id = v.innerDiameter || 0, od = v.outerDiameter || 0;
      const innerCirc = Math.PI * id, outerCirc = Math.PI * od;
      const ring = ringArea(id, od);
      const wasteCalc = applyWaste(ring, waste);
      return { gross: ring, deductions: 0, net: ring, borderLinear: outerCirc, borderArea: ring, total: wasteCalc.total, wastePercent: waste, wasteAmount: wasteCalc.wasteAmount,
        reviewRows: [row("Inner circumference", innerCirc, "lin ft", "linear"), row("Outer circumference", outerCirc, "lin ft", "linear"), row("Ring area", ring, "sq ft", "gross"), row("Material with waste", wasteCalc.total, "sq ft", "net")],
        formulaSteps: [`Inner circumference = π × ${fmt(id)} = ${fmt(innerCirc)} lin ft`, `Outer circumference = π × ${fmt(od)} = ${fmt(outerCirc)} lin ft`, `Ring area = π/4 × (${fmt(od)}² − ${fmt(id)}²) = ${fmt(ring)} sq ft`, `Waste ${waste}% → +${fmt(wasteCalc.wasteAmount)} sq ft`, `Total = ${fmt(wasteCalc.total)} sq ft`] };
    }
    const eff = borderLinear({ totalRun: v.totalRun, sharedEdges: v.sharedEdges, noBorderEdges: v.noBorderEdges });
    const rows = v.rows || 1;
    const widthFt = (v.borderWidth || 0) / 12;
    const borderArea = borderAreaFromLinear(eff, v.borderWidth, rows);
    const insideEdge = Math.max(0, eff - 2 * widthFt * rows * 4);
    const units = (v.unitLength || 0) > 0 ? Math.ceil(eff / ((v.unitLength || 0) / 12)) : 0;
    const corners = v.corners || 0;
    const wasteCalc = applyWaste(borderArea, waste);
    return { gross: borderArea, deductions: 0, net: borderArea, borderLinear: eff, borderArea, insideEdge, outsideEdge: eff, units, corners, total: wasteCalc.total, wastePercent: waste, wasteAmount: wasteCalc.wasteAmount,
      reviewRows: [row("Effective border linear", eff, "lin ft", "linear"), row("Outside-edge length", eff, "lin ft", "linear"), row("Inside-edge length", insideEdge, "lin ft", "linear"), row("Border area", borderArea, "sq ft", "gross"), ...(units ? [row("Material units", units, "pcs", "count")] : []), row("Corners", corners, "count", "count"), row("Material with waste", wasteCalc.total, "sq ft", "net")],
      formulaSteps: [`Effective = ${fmt(v.totalRun || 0)} − ${fmt(v.sharedEdges || 0)} − ${fmt(v.noBorderEdges || 0)} = ${fmt(eff)} lin ft`, `Border area = ${fmt(eff)} × ${fmt(widthFt)} × ${rows} = ${fmt(borderArea)} sq ft`, `Inside edge ≈ ${fmt(insideEdge)} lin ft`, ...(units ? [`Units = ${fmt(eff)} ÷ ${fmt((v.unitLength || 0) / 12)} = ${units} pcs`] : []), `Waste ${waste}% → +${fmt(wasteCalc.wasteAmount)} sq ft`, `Total = ${fmt(wasteCalc.total)} sq ft`] };
  },
};

export const PHASE2_CONFIGS = {
  patios: patiosConfig,
  walkways: walkwaysConfig,
  turf: turfConfig,
  driveways: drivewaysConfig,
  borders: bordersConfig,
};
import { Shovel, Box } from "lucide-react";
import { calcSteps, applyWaste, validateMeasurements, WASTE_OPTIONS, formatValue } from "@/lib/measurementUtils";
import { PHASE2_CONFIGS } from "@/lib/guidedConfigsPhase2";

const P = "hundredth";
const fmt = (v) => formatValue(v, P);
const req = (key, label, why, opts = {}) => ({ key, label, why, optional: false, ...opts });

// ---------- STEPS & STAIRS ----------
const STEPS_TYPE_CHOICES = [
  { id: "single", label: "Single Step", blurb: "One tread and riser.", bestUse: "A single entry step or threshold step.", difficulty: "Easy", diagram: "stepsSide", preview: { numSteps: 1, treadDepth: 1, riserHeight: 0.667, stepWidth: 4 }, requiredMeasurements: ["Width", "Tread depth", "Riser height"] },
  { id: "equal", label: "Equal Straight Steps", blurb: "All steps the same size.", bestUse: "A standard straight staircase with identical treads.", difficulty: "Easy", diagram: "stepsSide", preview: { numSteps: 3, treadDepth: 1, riserHeight: 0.667, stepWidth: 6 }, requiredMeasurements: ["Width", "Tread depth", "Riser height", "Step count", "Bullnose", "Total rise", "Total run"] },
  { id: "different", label: "Unequal Steps", blurb: "Each step entered separately.", bestUse: "Windings or stairs where each tread/riser differs.", difficulty: "Complex", diagram: "stepsSide", preview: { numSteps: 3, treadDepth: 1, riserHeight: 0.667, stepWidth: 5 }, requiredMeasurements: ["Width", "Each tread depth", "Each riser height", "Step count"] },
  { id: "landing", label: "Steps with Landing", blurb: "Stairs plus a mid or top landing.", bestUse: "Stairs that land on a porch or mid-platform.", difficulty: "Medium", diagram: "stepsSide", preview: { numSteps: 3, treadDepth: 1, riserHeight: 0.667, stepWidth: 6, landingDepth: 4, numLandings: 1 }, requiredMeasurements: ["Width", "Tread depth", "Riser height", "Landing length & width", "Bullnose", "Side returns"] },
  { id: "porch", label: "Porch and Steps", blurb: "Wide landing with steps off it.", bestUse: "Entry porch with steps leading down.", difficulty: "Medium", diagram: "stepsSide", preview: { numSteps: 2, treadDepth: 1, riserHeight: 0.583, stepWidth: 8, landingDepth: 6, numLandings: 1 }, requiredMeasurements: ["Porch length & width", "Step count", "Riser height", "Bullnose"] },
  { id: "wide", label: "Wide Entry Steps", blurb: "Broad steps spanning the entry.", bestUse: "Grand entry steps that span the full facade.", difficulty: "Easy", diagram: "stepsSide", preview: { numSteps: 2, treadDepth: 1.5, riserHeight: 0.583, stepWidth: 12 }, requiredMeasurements: ["Total width", "Tread depth", "Riser height", "Step count"] },
  { id: "curved", label: "Curved Steps", blurb: "Steps that follow a curve.", bestUse: "Steps that fan or curve along a radius.", difficulty: "Complex", diagram: "stepsSide", preview: { numSteps: 4, treadDepth: 1, riserHeight: 0.583, stepWidth: 6 }, requiredMeasurements: ["Inner & outer width", "Tread depth", "Riser height", "Step count", "Curve radius"] },
  { id: "sidewall", label: "Steps with Side Walls", blurb: "Steps flanked by seating/retaining walls.", bestUse: "Steps between two wing walls.", difficulty: "Medium", diagram: "stepsSide", preview: { numSteps: 3, treadDepth: 1, riserHeight: 0.667, stepWidth: 5 }, requiredMeasurements: ["Step width", "Tread depth", "Riser height", "Side wall height & length"] },
];

function stepsHelp(field) {
  const map = {
    stepWidth: { where: "Across the front of the steps, left edge to right edge.", text: "Measure the full width of the staircase, not one step.", example: "A 6 ft wide staircase reads 6' 0\".", mistake: "Measuring one tread side-to-side instead of the full width.", tool: "25 ft tape" },
    treadDepth: { where: "From the front edge (nose) of the tread straight back to the riser behind it.", text: "Do not include the bullnose overhang twice.", example: "A standard tread reads about 12\".", mistake: "Including the overhang on top of the tread below.", tool: "Tape measure" },
    riserHeight: { where: "The vertical face of one step, from one tread up to the next.", text: "Measure one riser; for equal steps we use it for all.", example: "Typical residential riser is 6–8\".", mistake: "Measuring total height and forgetting to divide by step count.", tool: "Tape measure" },
    numSteps: { where: "Count the treads you actually step on.", text: "The top landing usually is not a step.", example: "3 treads = 3 steps.", mistake: "Counting a landing as a step.", tool: "Count by eye" },
    landingDepth: { where: "Depth of the landing from front edge to back.", text: "Enter 0 if there is no landing.", example: "A 4 ft porch landing reads 4' 0\".", mistake: "Counting the landing depth as a tread.", tool: "Measuring wheel" },
    bullnosePieceLen: { where: "Length of one bullnose piece, if ordering separate nose pieces.", text: "Enter 0 to skip the piece count.", example: "An 18\" nose piece = 18.", mistake: "Entering the nose in feet instead of inches.", tool: "Tape measure" },
    waste: { where: "Extra material for cuts and breaks.", text: "10% is typical for straight layouts; 15% for curves.", example: "10%", mistake: "0% waste on a curved layout.", tool: "—" },
  };
  return map[field] || null;
}

const stepsConfig = {
  id: "steps",
  title: "Steps & Stairs",
  subtitle: "Rise, run, bullnose & surface area",
  icon: Shovel,
  typeChoices: STEPS_TYPE_CHOICES,
  expectedFields(typeId, v) {
    const base = [
      req("stepWidth", "Step width", "The full staircase width drives surface and bullnose totals."),
      req("treadDepth", "Tread depth", "Each tread depth times width gives tread surface area."),
      req("riserHeight", "Riser height", "Riser height gives total rise and the riser-face area."),
      req("numSteps", "Number of steps", "The step count scales all step-based totals."),
      { key: "landingDepth", label: "Landing depth", optional: true, allowZero: true },
      { key: "numLandings", label: "Number of landings", optional: true, allowZero: true },
      { key: "bullnosePieceLen", label: "Bullnose piece length", optional: true, allowZero: true },
      { key: "waste", label: "Waste %", optional: true, allowZero: true },
    ];
    if (typeId === "different") {
      const n = Math.max(0, Math.round(v.numSteps || 0));
      const per = [];
      for (let i = 1; i <= n; i++) {
        per.push(req(`tread_${i}`, `Step ${i} tread depth`, "Each tread may differ on a winding stair."));
        per.push(req(`riser_${i}`, `Step ${i} riser height`, "Each riser may differ."));
      }
      return [req("stepWidth", "Step width"), req("numSteps", "Number of steps"), ...per, { key: "waste", label: "Waste %", optional: true, allowZero: true }];
    }
    if (typeId === "porch" || typeId === "landing") {
      // landing depth matters but still optional (0 = no landing)
      return base;
    }
    return base;
  },
  getSteps(typeId, v) {
    const common = [
      { id: "stepWidth", question: "What is the step width? (across the front, left to right)", field: "stepWidth", unit: "ft", inputType: "length", help: stepsHelp("stepWidth"), diagram: "stepsSide", highlight: "stepWidth" },
      { id: "treadDepth", question: "Measure the tread depth — front edge back to the riser.", field: "treadDepth", unit: "ft", inputType: "length", help: stepsHelp("treadDepth"), diagram: "stepsSide", highlight: "treadDepth" },
      { id: "riserHeight", question: "Measure the riser height — the vertical face of one step.", field: "riserHeight", unit: "ft", inputType: "length", help: stepsHelp("riserHeight"), diagram: "stepsSide", highlight: "riserHeight" },
      { id: "numSteps", question: "How many steps (treads)?", field: "numSteps", unit: "", inputType: "integer", placeholder: "3", help: stepsHelp("numSteps"), diagram: "stepsSide", highlight: "numSteps" },
    ];
    if (typeId === "different") {
      const n = Math.max(0, Math.round(v.numSteps || 0));
      const per = [];
      for (let i = 1; i <= n; i++) {
        per.push({ id: `tread_${i}`, question: `Step ${i}: tread depth (ft)?`, field: `tread_${i}`, unit: "ft", inputType: "length", help: stepsHelp("treadDepth"), diagram: "stepsSide", highlight: "treadDepth" });
        per.push({ id: `riser_${i}`, question: `Step ${i}: riser height (ft)?`, field: `riser_${i}`, unit: "ft", inputType: "length", help: stepsHelp("riserHeight"), diagram: "stepsSide", highlight: "riserHeight" });
      }
      return [...common.slice(0, 1), { id: "numSteps", question: "How many steps (treads)?", field: "numSteps", unit: "", inputType: "integer", placeholder: "3", help: stepsHelp("numSteps"), diagram: "stepsSide", highlight: "numSteps" }, ...per, { id: "waste", question: "Waste %?", field: "waste", unit: "", inputType: "select", options: WASTE_OPTIONS, help: stepsHelp("waste"), diagram: "stepsSide" }];
    }
    return [
      ...common,
      { id: "landingDepth", question: "Landing depth? (enter 0 if none)", field: "landingDepth", unit: "ft", inputType: "length", help: stepsHelp("landingDepth"), diagram: "stepsSide", highlight: "landing" },
      { id: "numLandings", question: "How many landings?", field: "numLandings", unit: "", inputType: "integer", placeholder: "0", help: stepsHelp("numSteps"), diagram: "stepsSide" },
      { id: "bullnosePieceLen", question: "Bullnose piece length (in)? 0 to skip.", field: "bullnosePieceLen", unit: "in", inputType: "integer", placeholder: "0", help: stepsHelp("bullnosePieceLen"), diagram: "stepsSide" },
      { id: "waste", question: "Waste %?", field: "waste", unit: "", inputType: "select", options: WASTE_OPTIONS, help: stepsHelp("waste"), diagram: "stepsSide" },
    ];
  },
  verify(typeId, v, results) {
    const out = [];
    const n = Math.round(v.numSteps || 0);
    const riser = v.riserHeight || 0;
    const tread = v.treadDepth || 0;
    if (n > 0 && riser > 8 / 12) out.push({ id: "steep_riser", severity: "warning", field: "riserHeight", fixable: true, message: "Riser over 8 in — may be too steep.", why: "Risers above 8 in are uncomfortable and may not meet local code.", howToVerify: "Re-measure one riser face; confirm it is the vertical, not diagonal." });
    if (n > 0 && riser > 0 && riser < 4 / 12) out.push({ id: "shallow_riser", severity: "warning", field: "riserHeight", fixable: true, message: "Riser under 4 in — unusually shallow.", why: "Very shallow risers are a trip hazard.", howToVerify: "Re-measure the riser face height." });
    if (tread > 0 && tread < 10 / 12) out.push({ id: "shallow_tread", severity: "warning", field: "treadDepth", fixable: true, message: "Tread under 10 in — unusually shallow.", why: "Shallow treads reduce foot room on each step.", howToVerify: "Measure nose-to-riser horizontally." });
    const numLandings = Math.round(v.numLandings || 0);
    if (numLandings > 0 && numLandings >= n) out.push({ id: "landing_double", severity: "warning", field: "numLandings", fixable: true, message: "Landing count near step count — landing may be counted as a step.", why: "Double-counting a landing inflates step surface and bullnose.", howToVerify: "Count only treads you step on; landings are separate." });
    if (typeId === "different" && n > 0) {
      for (let i = 1; i <= n; i++) {
        if (v[`tread_${i}`] == null) out.push({ id: `missing_tread_${i}`, severity: "error", field: `tread_${i}`, fixable: true, message: `Step ${i} tread depth missing.`, why: "Each step's tread is required for an unequal-step layout.", howToVerify: `Measure step ${i}'s tread nose-to-riser.` });
        if (v[`riser_${i}`] == null) out.push({ id: `missing_riser_${i}`, severity: "error", field: `riser_${i}`, fixable: true, message: `Step ${i} riser height missing.`, why: "Each riser is required for total rise.", howToVerify: `Measure step ${i}'s riser face.` });
      }
    }
    return out;
  },
  compute(typeId, v) {
    if (typeId === "different") {
      const n = Math.max(0, Math.round(v.numSteps || 0));
      const width = v.stepWidth || 0;
      const waste = v.waste == null ? 10 : v.waste;
      let surface = 0, riserFace = 0, totalRise = 0;
      for (let i = 1; i <= n; i++) {
        const t = v[`tread_${i}`] || 0;
        const r = v[`riser_${i}`] || 0;
        surface += t * width;
        riserFace += r * width;
        totalRise += r;
      }
      const bullnoseLinear = width * n;
      const wasteCalc = applyWaste(surface, waste);
      return {
        gross: surface, deductions: 0, net: surface, linear: bullnoseLinear,
        wastePercent: waste, wasteAmount: wasteCalc.wasteAmount, total: wasteCalc.total,
        warnings: [],
        formulaSteps: [
          `Step surface = Σ(tread × width) = ${fmt(surface)} sq ft`,
          `Riser face = Σ(riser × width) = ${fmt(riserFace)} sq ft`,
          `Bullnose = width × steps = ${fmt(bullnoseLinear)} lin ft`,
          `Total rise = Σ risers = ${fmt(totalRise)} ft`,
          `Waste ${waste}% → +${fmt(wasteCalc.wasteAmount)} sq ft`,
          `Total material = ${fmt(wasteCalc.total)} sq ft`,
        ],
        reviewRows: [
          { label: "Tread surface area", value: surface, unit: "sq ft", kind: "gross" },
          { label: "Riser face area", value: riserFace, unit: "sq ft", kind: "gross" },
          { label: "Bullnose linear", value: bullnoseLinear, unit: "lin ft", kind: "linear" },
          { label: "Total rise", value: totalRise, unit: "ft", kind: "count" },
          { label: "Material with waste", value: wasteCalc.total, unit: "sq ft", kind: "net" },
        ],
      };
    }
    const numSteps = Math.round(v.numSteps || 0);
    const tread = v.treadDepth || 0;
    const riser = v.riserHeight || 0;
    const width = v.stepWidth || 0;
    const landingDepth = v.landingDepth || 0;
    const numLandings = Math.round(v.numLandings || 0);
    const bullnosePieceLen = v.bullnosePieceLen || 0;
    const waste = v.waste == null ? 10 : v.waste;
    const totalHeight = riser * numSteps;
    const r = calcSteps({ numSteps, totalHeight, stepWidth: width, treadDepth: tread, landingDepth, numLandings });
    const bullnoseLinear = width * numSteps;
    const sideEdgeLinear = r.totalDepth * 2;
    const bullnosePieces = bullnosePieceLen > 0 ? Math.ceil(bullnoseLinear / (bullnosePieceLen / 12)) : 0;
    const wasteCalc = applyWaste(r.totalStepArea, waste);
    const warnings = validateMeasurements({ totalHeight, numSteps, wastePercent: waste }, "steps");
    return {
      gross: r.totalStepArea, deductions: 0, net: r.totalStepArea, linear: bullnoseLinear,
      wastePercent: waste, wasteAmount: wasteCalc.wasteAmount, total: wasteCalc.total, bullnosePieces, sideEdgeLinear,
      warnings,
      formulaSteps: [
        `Rise/step = ${fmt(totalHeight)} ÷ ${numSteps} = ${fmt(r.risePerStep)} ft`,
        `Total run = ${fmt(tread)} × ${numSteps} = ${fmt(r.totalRun)} ft`,
        `Step surface = ${fmt(tread)} × ${fmt(width)} × ${numSteps} = ${fmt(r.stepSurfaceArea)} sq ft`,
        `Landing area = ${fmt(landingDepth)} × ${fmt(width)} × ${numLandings} = ${fmt(r.landingArea)} sq ft`,
        `Bullnose = ${fmt(width)} × ${numSteps} = ${fmt(bullnoseLinear)} lin ft`,
        `Waste ${waste}% → +${fmt(wasteCalc.wasteAmount)} sq ft`,
        `Total material = ${fmt(wasteCalc.total)} sq ft`,
      ],
      reviewRows: [
        { label: "Rise per step", value: r.risePerStep, unit: "ft", kind: "count" },
        { label: "Total run", value: r.totalRun, unit: "ft", kind: "count" },
        { label: "Tread surface area", value: r.stepSurfaceArea, unit: "sq ft", kind: "gross" },
        { label: "Riser face area", value: r.riserFaceArea, unit: "sq ft", kind: "gross" },
        { label: "Landing area", value: r.landingArea, unit: "sq ft", kind: "gross" },
        { label: "Bullnose linear", value: bullnoseLinear, unit: "lin ft", kind: "linear" },
        { label: "Side-edge linear", value: sideEdgeLinear, unit: "lin ft", kind: "linear" },
        ...(bullnosePieces > 0 ? [{ label: "Bullnose pieces", value: bullnosePieces, unit: "pcs", kind: "count" }] : []),
        { label: "Material with waste", value: wasteCalc.total, unit: "sq ft", kind: "net" },
      ],
    };
  },
};

// ---------- WALLS & PLANTERS ----------
const WALL_TYPE_CHOICES = [
  { id: "straight", label: "Straight Wall", blurb: "One segment, two ends.", bestUse: "A single freestanding or retaining run.", difficulty: "Easy", diagram: "wallElevation", preview: { wallLength: 20, wallHeight: 2 }, requiredMeasurements: ["Wall length", "Visible height", "Block depth", "Exposed ends"] },
  { id: "L", label: "L-Shaped Wall", blurb: "Two segments meeting at a corner.", bestUse: "Two walls forming an L with a shared corner.", difficulty: "Medium", diagram: "wallPlan", preview: { segments: [{ length: 20, height: 2 }, { length: 10, height: 2 }] }, requiredMeasurements: ["Each segment length & height", "Corners", "Exposed ends", "Caps"] },
  { id: "U", label: "U-Shaped Wall", blurb: "Three connected segments.", bestUse: "A wall wrapping three sides (e.g. seating alcove).", difficulty: "Medium", diagram: "wallPlan", preview: { segments: [{ length: 10, height: 2 }, { length: 12, height: 2 }, { length: 10, height: 2 }] }, requiredMeasurements: ["3 segment lengths & heights", "Corners", "Exposed ends"] },
  { id: "curved", label: "Curved Wall", blurb: "Wheel length or chord + depth.", bestUse: "A wall that bends along a radius.", difficulty: "Complex", diagram: "wallPlan", preview: { segments: [{ length: 24, height: 2 }] }, requiredMeasurements: ["Wheel length", "Chord & depth", "Height", "Caps"] },
  { id: "treewell", label: "Circular Tree Well", blurb: "Ring around a tree.", bestUse: "A ring wall enclosing a tree.", difficulty: "Complex", diagram: "wallPlan", preview: { segments: [{ length: 31, height: 1.5 }] }, requiredMeasurements: ["Ring circumference", "Diameter", "Height", "Caps"] },
  { id: "planter", label: "Raised Planter", blurb: "Enclosed planter box.", bestUse: "A closed planter with soil interior.", difficulty: "Medium", diagram: "wallPlan", preview: { segments: [{ length: 6, height: 1.5 }, { length: 4, height: 1.5 }, { length: 6, height: 1.5 }, { length: 4, height: 1.5 }] }, requiredMeasurements: ["Wall segments", "Wall height", "Cap length", "Inside corners", "Soil interior"] },
  { id: "retaining", label: "Retaining Wall", blurb: "Holds back soil.", bestUse: "A wall retaining a slope.", difficulty: "Medium", diagram: "wallElevation", preview: { wallLength: 30, wallHeight: 3 }, requiredMeasurements: ["Length", "Exposed height", "Buried course", "Block depth"] },
  { id: "seating", label: "Seating Wall", blurb: "Low wall for seating.", bestUse: "A low wall around a fire pit or patio.", difficulty: "Easy", diagram: "wallElevation", preview: { wallLength: 16, wallHeight: 1.5 }, requiredMeasurements: ["Length", "Height", "Caps", "Exposed ends"] },
  { id: "columns", label: "Wall with Columns", blurb: "Pillars between segments.", bestUse: "Wall sections broken up by pillars.", difficulty: "Complex", diagram: "wallPlan", preview: { segments: [{ length: 8, height: 2 }, { length: 8, height: 2 }] }, requiredMeasurements: ["Segment lengths", "Pillar count", "Height", "Caps"] },
  { id: "multiple", label: "Multiple Connected", blurb: "Segment A, B, C and more.", bestUse: "A custom connected wall layout.", difficulty: "Complex", diagram: "wallPlan", preview: { segments: [{ length: 12, height: 2 }, { length: 8, height: 2 }, { length: 6, height: 2 }] }, requiredMeasurements: ["Each segment length & height", "Corners", "Exposed ends"] },
];

const MULTI_TYPES = ["L", "U", "multiple", "curved", "treewell", "planter", "columns"];

function wallHelp(field) {
  const map = {
    wallLength: { where: "Along the face of the wall, end to end.", text: "Use a measuring wheel for long or curved runs.", example: "A 20 ft wall reads 20' 0\".", mistake: "Measuring only one side of an L as the full length.", tool: "Measuring wheel" },
    wallHeight: { where: "Visible height only — from finished grade to top of cap.", text: "Do not include the buried course.", example: "A 2 ft exposed height reads 2' 0\".", mistake: "Including the buried base course.", tool: "Tape measure" },
    blockDepth: { where: "Front-to-back depth of one block.", text: "Used for exposed-end area and cap seating.", example: "An 8\" deep block = 0' 8\".", mistake: "Confusing block depth with block length.", tool: "Tape measure" },
    courses: { where: "Number of block rows stacked up.", text: "Enter 0 if unknown — height still calculates.", example: "5 courses.", mistake: "Counting the buried course as course 1.", tool: "Count by eye" },
    buriedCourse: { where: "Base courses buried below grade.", text: "Excluded from face area.", example: "1 buried course.", mistake: "Adding buried height into face area.", tool: "—" },
    caps: { where: "Cap row on top of the wall.", text: "Single or double cap affects linear coverage.", example: "Single cap.", mistake: "Ordering caps without allowing cuts.", tool: "—" },
    exposedEnds: { where: "Visible block ends at wall terminations.", text: "Each end = block depth × height area.", example: "2 ends on a straight wall.", mistake: "Counting a shared corner as an end.", tool: "—" },
    corners: { where: "Inside or outside corners where segments meet.", text: "Corners use corner blocks, not shared ends.", example: "1 corner on an L.", mistake: "Double-counting a shared end as both end and corner.", tool: "—" },
    openings: { where: "Total area of gaps (windows, gates).", text: "Subtracted from face area.", example: "A 3×3 gate = 9 sq ft.", mistake: "Subtracting opening length instead of area.", tool: "Tape measure" },
    numSegments: { where: "How many connected wall segments.", text: "L = 2, U = 3, custom = any.", example: "3 segments.", mistake: "Counting a corner as its own segment.", tool: "—" },
    waste: { where: "Extra block for cuts and breaks.", text: "5% straight, 10%+ for curves/corners.", example: "10%", mistake: "0% on a wall with many corners.", tool: "—" },
  };
  return map[field] || null;
}

const wallsConfig = {
  id: "walls",
  title: "Walls & Planters",
  subtitle: "Face area, caps, ends & corners",
  icon: Box,
  typeChoices: WALL_TYPE_CHOICES,
  expectedFields(typeId, v) {
    if (MULTI_TYPES.includes(typeId)) {
      return [
        req("numSegments", "Number of segments", "Sets how many wall lengths you'll enter."),
        req("segments", "Wall segments", "Each segment's length and height make up the face area."),
        { key: "blockDepth", label: "Block depth", optional: true, allowZero: true },
        { key: "caps", label: "Cap style", optional: true, allowZero: true },
        { key: "exposedEnds", label: "Exposed ends", optional: true, allowZero: true },
        { key: "corners", label: "Corners", optional: true, allowZero: true },
        { key: "openings", label: "Openings", optional: true, allowZero: true },
        { key: "waste", label: "Waste %", optional: true, allowZero: true },
      ];
    }
    return [
      req("wallLength", "Wall length", "Length times height gives the wall-face area."),
      req("wallHeight", "Visible wall height", "Exposed height only — excludes the buried course."),
      { key: "blockDepth", label: "Block depth", optional: true, allowZero: true },
      { key: "courses", label: "Courses", optional: true, allowZero: true },
      { key: "buriedCourse", label: "Buried course", optional: true, allowZero: true },
      { key: "caps", label: "Cap style", optional: true, allowZero: true },
      { key: "exposedEnds", label: "Exposed ends", optional: true, allowZero: true },
      { key: "corners", label: "Corners", optional: true, allowZero: true },
      { key: "openings", label: "Openings", optional: true, allowZero: true },
      { key: "waste", label: "Waste %", optional: true, allowZero: true },
    ];
  },
  getSteps(typeId, v) {
    if (MULTI_TYPES.includes(typeId)) {
      const defaultN = typeId === "L" ? 2 : typeId === "U" ? 3 : Math.max(1, Math.round(v.numSegments || 1));
      return [
        { id: "numSegments", question: "How many wall segments?", field: "numSegments", unit: "", inputType: "integer", placeholder: String(defaultN), help: wallHelp("numSegments"), diagram: "wallPlan", highlight: "numSegments" },
        { id: "segments", question: "Enter each segment's length and height.", field: "segments", unit: "", inputType: "segments", help: wallHelp("wallLength"), diagram: "wallPlan" },
        { id: "blockDepth", question: "Block depth (front to back)?", field: "blockDepth", unit: "ft", inputType: "length", help: wallHelp("blockDepth"), diagram: "wallElevation", highlight: "wallLength" },
        { id: "caps", question: "Cap style?", field: "caps", unit: "", inputType: "select", options: [{ value: "none", label: "None" }, { value: "single", label: "Single" }, { value: "double", label: "Double" }], help: wallHelp("caps"), diagram: "wallElevation" },
        { id: "exposedEnds", question: "How many exposed ends?", field: "exposedEnds", unit: "", inputType: "integer", placeholder: "2", help: wallHelp("exposedEnds"), diagram: "wallElevation" },
        { id: "corners", question: "How many corners?", field: "corners", unit: "", inputType: "integer", placeholder: "0", help: wallHelp("corners"), diagram: "wallPlan" },
        { id: "openings", question: "Total openings area (sq ft)? 0 if none.", field: "openings", unit: "sq ft", inputType: "length", help: wallHelp("openings"), diagram: "wallElevation" },
        { id: "waste", question: "Waste %?", field: "waste", unit: "", inputType: "select", options: WASTE_OPTIONS, help: wallHelp("waste"), diagram: "wallElevation" },
      ];
    }
    return [
      { id: "wallLength", question: "Measure the wall length, end to end.", field: "wallLength", unit: "ft", inputType: "length", help: wallHelp("wallLength"), diagram: "wallElevation", highlight: "wallLength" },
      { id: "wallHeight", question: "Measure the visible wall height (exclude buried course).", field: "wallHeight", unit: "ft", inputType: "length", help: wallHelp("wallHeight"), diagram: "wallElevation", highlight: "wallHeight" },
      { id: "blockDepth", question: "Block depth (front to back)?", field: "blockDepth", unit: "ft", inputType: "length", help: wallHelp("blockDepth"), diagram: "wallPlan", highlight: "wallLength" },
      { id: "courses", question: "Number of courses? (0 if unknown)", field: "courses", unit: "", inputType: "integer", placeholder: "0", help: wallHelp("courses"), diagram: "wallElevation" },
      { id: "buriedCourse", question: "Buried base courses? (excluded from face)", field: "buriedCourse", unit: "", inputType: "integer", placeholder: "1", help: wallHelp("buriedCourse"), diagram: "wallElevation" },
      { id: "caps", question: "Cap style?", field: "caps", unit: "", inputType: "select", options: [{ value: "none", label: "None" }, { value: "single", label: "Single" }, { value: "double", label: "Double" }], help: wallHelp("caps"), diagram: "wallElevation" },
      { id: "exposedEnds", question: "How many exposed ends?", field: "exposedEnds", unit: "", inputType: "integer", placeholder: "2", help: wallHelp("exposedEnds"), diagram: "wallElevation" },
      { id: "corners", question: "How many corners? (0 for straight)", field: "corners", unit: "", inputType: "integer", placeholder: "0", help: wallHelp("corners"), diagram: "wallElevation" },
      { id: "openings", question: "Total openings area (sq ft)? 0 if none.", field: "openings", unit: "sq ft", inputType: "length", help: wallHelp("openings"), diagram: "wallElevation" },
      { id: "waste", question: "Waste %?", field: "waste", unit: "", inputType: "select", options: WASTE_OPTIONS, help: wallHelp("waste"), diagram: "wallElevation" },
    ];
  },
  verify(typeId, v, results) {
    const out = [];
    const segs = Array.isArray(v.segments) ? v.segments : v.wallLength ? [{ length: v.wallLength, height: v.wallHeight || 0 }] : [];
    const blockDepth = v.blockDepth || 0;
    const exposedEnds = Math.round(v.exposedEnds || 0);
    const corners = Math.round(v.corners || 0);
    if (segs.some((s) => !s.height)) out.push({ id: "seg_height", severity: "warning", field: "segments", fixable: true, message: "A segment is missing visible height.", why: "Face area is length × height — missing height makes that segment's area zero.", howToVerify: "Measure each segment's exposed height." });
    if (segs.some((s) => !s.length)) out.push({ id: "seg_length", severity: "warning", field: "segments", fixable: true, message: "A segment is missing length.", why: "Length is needed for face area and cap linear.", howToVerify: "Measure each segment end to end." });
    if (exposedEnds > 0 && !blockDepth) out.push({ id: "ends_no_depth", severity: "warning", field: "blockDepth", fixable: true, message: "Exposed ends entered but block depth missing.", why: "End area = block depth × height; without depth the end area can't be calculated.", howToVerify: "Measure the front-to-back depth of one block." });
    if (corners > 0 && segs.length === 1 && !MULTI_TYPES.includes(typeId)) out.push({ id: "corner_straight", severity: "warning", field: "corners", fixable: true, message: "Corners entered for a single straight wall.", why: "A single straight run has no shared corners — this may double-count cap linear.", howToVerify: "Set corners to 0, or switch to a multi-segment type." });
    if (results && results.net < 0) out.push({ id: "openings_over", severity: "error", field: "openings", fixable: true, message: "Openings are larger than the wall face.", why: "Net face area went negative — openings likely entered wrong.", howToVerify: "Check openings area vs. total face area." });
    return out;
  },
  compute(typeId, v) {
    let segs;
    if (MULTI_TYPES.includes(typeId)) {
      segs = Array.isArray(v.segments) ? v.segments : [];
    } else {
      segs = v.wallLength ? [{ length: v.wallLength, height: v.wallHeight || 0 }] : [];
    }
    const faceArea = segs.reduce((s, sg) => s + (sg.length || 0) * (sg.height || 0), 0);
    const capsLinear = segs.reduce((s, sg) => s + (sg.length || 0), 0);
    const blockDepth = v.blockDepth || 0;
    const exposedEnds = Math.round(v.exposedEnds || 0);
    const corners = Math.round(v.corners || 0);
    const openings = v.openings || 0;
    const waste = v.waste == null ? 10 : v.waste;
    const endArea = exposedEnds * blockDepth * (segs.length ? Math.max(...segs.map((s) => s.height || 0)) : 0);
    const netArea = Math.max(0, faceArea - openings);
    const wasteCalc = applyWaste(netArea, waste);
    const capsLinearAdj = Math.max(0, capsLinear - corners);
    const warnings = [];
    const reviewRows = [
      { label: "Wall-face area", value: faceArea, unit: "sq ft", kind: "gross" },
      { label: "Openings deducted", value: openings, unit: "sq ft", kind: "deduct" },
      { label: "Net face area", value: netArea, unit: "sq ft", kind: "net" },
      { label: "Exposed-end area", value: endArea, unit: "sq ft", kind: "gross" },
      { label: "Cap linear (minus corners)", value: capsLinearAdj, unit: "lin ft", kind: "linear" },
      { label: "Corners", value: corners, unit: "count", kind: "count" },
      { label: "Material with waste", value: wasteCalc.total, unit: "sq ft", kind: "net" },
    ];
    const formulaSteps = [
      `Face area = Σ(length × height) = ${fmt(faceArea)} sq ft`,
      `Openings = ${fmt(openings)} sq ft`,
      `Net = ${fmt(faceArea)} − ${fmt(openings)} = ${fmt(netArea)} sq ft`,
      `Cap linear = Σ lengths − ${corners} shared corner(s) = ${fmt(capsLinearAdj)} lin ft`,
      `Exposed-end area = ${exposedEnds} × ${fmt(blockDepth)} × height = ${fmt(endArea)} sq ft`,
      `Waste ${waste}% → +${fmt(wasteCalc.wasteAmount)} sq ft`,
      `Total material = ${fmt(wasteCalc.total)} sq ft`,
    ];
    return {
      gross: faceArea, deductions: openings, net: netArea, linear: capsLinearAdj,
      wastePercent: waste, wasteAmount: wasteCalc.wasteAmount, total: wasteCalc.total,
      warnings, formulaSteps, reviewRows,
    };
  },
};

export const GUIDED_CONFIGS = {
  steps: stepsConfig,
  walls: wallsConfig,
  ...PHASE2_CONFIGS,
};

export function getGuidedConfig(id) {
  return GUIDED_CONFIGS[id] || null;
}
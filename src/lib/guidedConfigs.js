import { Shovel, Box } from "lucide-react";
import { calcSteps, applyWaste, validateMeasurements, WASTE_OPTIONS, formatValue } from "@/lib/measurementUtils";

const P = "hundredth";
const fmt = (v) => formatValue(v, P);

// ---------- STEPS & STAIRS ----------
const STEPS_TYPE_CHOICES = [
  { id: "single", label: "Single Step", blurb: "One tread and riser.", diagram: "stepsSide" },
  { id: "equal", label: "Multiple Equal Steps", blurb: "All steps the same size.", diagram: "stepsSide" },
  { id: "different", label: "Different-Sized Steps", blurb: "Each step entered separately.", diagram: "stepsSide" },
  { id: "landing", label: "Steps with Landing", blurb: "Stairs plus a mid or top landing.", diagram: "stepsSide" },
  { id: "porch", label: "Porch and Steps", blurb: "Wide landing with steps off it.", diagram: "stepsSide" },
  { id: "curved", label: "Curved Steps", blurb: "Steps that follow a curve.", diagram: "stepsSide" },
  { id: "cover", label: "Existing Steps Being Covered", blurb: "Overlaying existing stairs.", diagram: "stepsSide" },
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
      const sideEdgeLinear = surface > 0 ? (n ? 0 : 0) : 0; // kept simple for per-step
      const wasteCalc = applyWaste(surface, waste);
      const warnings = [];
      if (n > 0 && totalRise / n > 8 / 12) warnings.push("Average riser over 8 in — may be too steep.");
      if (n > 0 && totalRise / n < 4 / 12) warnings.push("Average riser under 4 in — unusually shallow.");
      if (width <= 0) warnings.push("Step width is missing.");
      return {
        gross: surface, deductions: 0, net: surface, linear: bullnoseLinear,
        wastePercent: waste, wasteAmount: wasteCalc.wasteAmount, total: wasteCalc.total,
        warnings,
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
    if (riser > 0 && riser > 8 / 12) warnings.push("Riser over 8 in — may be too steep.");
    if (tread > 0 && tread < 10 / 12) warnings.push("Tread under 10 in — unusually shallow.");
    if (numLandings > 0 && numLandings >= numSteps) warnings.push("Landing count near step count — make sure landings aren't counted as steps.");
    if (width <= 0) warnings.push("Step width is missing.");
    if (riser <= 0) warnings.push("Riser height is missing — cannot compute rise per step.");
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
  { id: "straight", label: "Straight Wall", blurb: "One segment, two ends.", diagram: "wallElevation" },
  { id: "L", label: "L-Shaped Wall", blurb: "Two segments meeting at a corner.", diagram: "wallPlan" },
  { id: "U", label: "U-Shaped Wall", blurb: "Three connected segments.", diagram: "wallPlan" },
  { id: "curved", label: "Curved Wall", blurb: "Wheel length or chord + depth.", diagram: "wallPlan" },
  { id: "treewell", label: "Circular Tree Well", blurb: "Ring around a tree.", diagram: "wallPlan" },
  { id: "planter", label: "Raised Planter", blurb: "Enclosed planter box.", diagram: "wallPlan" },
  { id: "retaining", label: "Retaining Wall", blurb: "Holds back soil.", diagram: "wallElevation" },
  { id: "seating", label: "Seating Wall", blurb: "Low wall for seating.", diagram: "wallElevation" },
  { id: "columns", label: "Wall with Columns", blurb: "Pillars between segments.", diagram: "wallPlan" },
  { id: "multiple", label: "Multiple Connected", blurb: "Segment A, B, C and more.", diagram: "wallPlan" },
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
    const capStyle = v.caps || "none";
    const endArea = exposedEnds * blockDepth * (segs.length ? Math.max(...segs.map((s) => s.height || 0)) : 0);
    const netArea = Math.max(0, faceArea - openings);
    const wasteCalc = applyWaste(netArea, waste);
    const capsLinearAdj = Math.max(0, capsLinear - corners); // shared corners not double-counted
    const warnings = [];
    if (segs.some((s) => !s.height)) warnings.push("A segment is missing visible height — face area will be incomplete.");
    if (segs.some((s) => !s.length)) warnings.push("A segment is missing length.");
    if (exposedEnds > 0 && !blockDepth) warnings.push("Exposed ends entered but block depth missing — end area can't be calculated.");
    if (corners > 0 && segs.length === 1 && !MULTI_TYPES.includes(typeId)) warnings.push("Corners entered for a single straight wall — check this is intended.");
    if (netArea < 0) warnings.push("Openings are larger than the wall face — check your measurements.");
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
};

export function getGuidedConfig(id) {
  return GUIDED_CONFIGS[id] || null;
}
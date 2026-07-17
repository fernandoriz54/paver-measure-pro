// Calculation utilities for the Home Entrance calculator.
// Inches are converted to feet before any area math; linear and square footage
// are always kept separate.

export const num = (v) => (parseFloat(v) || 0);
export const inchToFeet = (inches) => num(inches) / 12;

export const COVERAGE_MODES = [
  { value: "tread", label: "Tread surfaces only" },
  { value: "tread+riser", label: "Tread surfaces + riser faces" },
  { value: "tread+riser+side", label: "Treads + risers + side faces" },
  { value: "complete", label: "Complete step coverage" },
];

export const BORDER_MODES = [
  { value: "outside", label: "Border is outside the measured area" },
  { value: "inside", label: "Border is included inside the measured area" },
  { value: "replaces", label: "Border replaces part of the field paver area" },
];

export const newStep = (i) => ({
  id: Date.now() + i,
  width: 6,
  treadDepthIn: 14,
  riserHeightIn: 6,
  frontEdge: true,
  leftReturn: 0,
  rightReturn: 0,
  includeLeftSide: false,
  includeRightSide: false,
  notes: "",
});

// Per-step derived values
export function stepCalc(s) {
  const width = num(s.width);
  const treadDepthFt = inchToFeet(s.treadDepthIn);
  const riserHeightFt = inchToFeet(s.riserHeightIn);
  const treadArea = width * treadDepthFt;
  const riserArea = width * riserHeightFt;
  const frontBullnose = s.frontEdge ? width : 0;
  const leftReturn = num(s.leftReturn);
  const rightReturn = num(s.rightReturn);
  const leftSideArea = s.includeLeftSide ? treadDepthFt * riserHeightFt : 0;
  const rightSideArea = s.includeRightSide ? treadDepthFt * riserHeightFt : 0;
  return {
    width, treadDepthFt, riserHeightFt, treadArea, riserArea,
    frontBullnose, leftReturn, rightReturn,
    sideReturns: leftReturn + rightReturn,
    leftSideArea, rightSideArea,
    bullnoseLinear: frontBullnose + leftReturn + rightReturn,
  };
}

// Full entrance project calculation
export function computeEntrance(p) {
  const walkwayArea = num(p.walkway.length) * num(p.walkway.width);
  const porchArea = num(p.porch.length) * num(p.porch.width);
  const landingArea = num(p.landing.length) * num(p.landing.width);

  const stepsTable = (p.steps || []).map((s, i) => ({ step: i + 1, ...stepCalc(s), notes: s.notes }));

  const stepTreadArea = stepsTable.reduce((a, s) => a + s.treadArea, 0);
  const includeRiser = p.coverageMode !== "tread";
  const includeSide = p.coverageMode === "tread+riser+side" || p.coverageMode === "complete";
  const riserFaceArea = includeRiser ? stepsTable.reduce((a, s) => a + s.riserArea, 0) : 0;
  const leftSideArea = includeSide ? stepsTable.reduce((a, s) => a + s.leftSideArea, 0) : 0;
  const rightSideArea = includeSide ? stepsTable.reduce((a, s) => a + s.rightSideArea, 0) : 0;
  const sideFaceArea = leftSideArea + rightSideArea;

  // Bullnose — add each individual edge measurement, never width × count
  const stepBullnoseLinear = stepsTable.reduce((a, s) => a + s.bullnoseLinear, 0);
  const bl = p.bullnoseLanding || {};
  const bp = p.bullnosePorch || {};
  const landingBullnoseLinear = num(bl.front) + num(bl.left) + num(bl.right) + num(bl.back);
  const porchBullnoseLinear = num(bp.front) + num(bp.left) + num(bp.right) + num(bp.back);
  const extraBullnoseLinear = num(p.bullnoseExtra);
  const totalBullnoseLinear =
    stepBullnoseLinear + landingBullnoseLinear + porchBullnoseLinear + extraBullnoseLinear;

  // Border
  const b = p.border || {};
  const borderWidthFt = inchToFeet(b.widthIn);
  const borderLinearTotal =
    num(b.linearFeetWalkway) + num(b.linearFeetPorch) +
    num(b.linearFeetLanding) + num(b.linearFeetSteps) + num(b.linearFeetPerimeter);
  const borderArea = borderLinearTotal * borderWidthFt;

  const base =
    walkwayArea + porchArea + landingArea + stepTreadArea + riserFaceArea + sideFaceArea;
  let gross = base;
  if (b.mode === "outside") gross = base + borderArea;
  else if (b.mode === "replaces") gross = base - borderArea;

  const deductionItems = (p.deductions || []).map((d) => ({ label: d.label, area: num(d.area) }));
  const existingConcreteArea = num(p.existingConcrete.length) * num(p.existingConcrete.width);
  if (existingConcreteArea > 0) deductionItems.push({ label: "Existing concrete", area: existingConcreteArea });
  const deductionArea = deductionItems.reduce((a, d) => a + d.area, 0);
  const netArea = Math.max(0, gross - deductionArea);
  const wasteArea = netArea * (num(p.wastePct) / 100);
  const finalQuantity = netArea + wasteArea;
  const paverSqftPerPallet = num((p.paverProduct || {}).sqftPerPallet);
  const paverPallets = paverSqftPerPallet > 0 ? Math.ceil(finalQuantity / paverSqftPerPallet) : 0;

  // Bullnose product quantity
  const bn = p.bullnoseProduct || {};
  const pieceLenFt = inchToFeet(bn.lengthIn);
  const bullnosePiecesBase = pieceLenFt > 0 ? Math.ceil(totalBullnoseLinear / pieceLenFt) : 0;
  const bullnoseWastePieces = Math.ceil(bullnosePiecesBase * (num(bn.wastePct) / 100));
  const bullnoseFinalPieces = bullnosePiecesBase + bullnoseWastePieces;
  const bullnosePallets =
    bn.piecesPerPallet > 0 ? Math.ceil(bullnoseFinalPieces / num(bn.piecesPerPallet)) : 0;

  // Rise & run
  const rr = p.riseRun || {};
  const riserHeights = (rr.riserHeights || []).map(num);
  const treadDepths = (rr.treadDepths || []).map(num);
  const totalRise = riserHeights.length ? riserHeights.reduce((a, h) => a + h, 0) : inchToFeet(rr.totalHeightIn);
  const numRisers = num(rr.numRisers) || riserHeights.length || p.steps.length;
  const avgRiser = numRisers > 0 ? totalRise / numRisers : 0;
  const totalRun = treadDepths.reduce((a, d) => a + d, 0);
  const avgTread = treadDepths.length ? totalRun / treadDepths.length : 0;
  const footprint = totalRun + (rr.includeLandingInRun ? num(rr.landingDepthFt) : 0);
  const riserDiffs = [];
  for (let i = 1; i < riserHeights.length; i++) riserDiffs.push(Math.abs(riserHeights[i] - riserHeights[i - 1]));
  const inconsistentRisers = riserDiffs.some((d) => d > inchToFeet(1.5));

  return {
    walkwayArea, porchArea, landingArea,
    stepTreadArea, riserFaceArea, leftSideArea, rightSideArea, sideFaceArea,
    borderArea, borderLinearTotal, borderWidthFt,
    gross, deductionArea, deductionItems, netArea, wasteArea, finalQuantity,
    stepBullnoseLinear, landingBullnoseLinear, porchBullnoseLinear, extraBullnoseLinear, totalBullnoseLinear,
    bullnosePiecesBase, bullnoseWastePieces, bullnoseFinalPieces, bullnosePallets,
    paverPallets,
    totalRise, numRisers, avgRiser, totalRun, avgTread, footprint, riserDiffs, inconsistentRisers,
    stepsTable,
  };
}

// Verification checklist — auto-detect missing/unusual measurements
export function verificationChecks(p, r, confirmed) {
  const steps = p.steps || [];
  const checks = [
    { id: "stepWidth", label: "Every step width was measured", pass: steps.every((s) => num(s.width) > 0) },
    { id: "treadDepth", label: "Every tread depth was measured", pass: steps.every((s) => num(s.treadDepthIn) > 0) },
    { id: "riserHeight", label: "Every riser height was measured", pass: steps.every((s) => num(s.riserHeightIn) > 0) },
    { id: "landing", label: "Top landing was measured", pass: num(p.landing.length) > 0 && num(p.landing.width) > 0 },
    { id: "bullnoseEdges", label: "Exposed bullnose edges identified", pass: steps.some((s) => s.frontEdge) || r.totalBullnoseLinear > 0 },
    { id: "sideReturns", label: "Side returns included or excluded", pass: true, manual: true },
    { id: "riserFaces", label: "Riser faces included or excluded", pass: !!p.coverageMode, manual: true },
    { id: "borderWidth", label: "Border width entered correctly", pass: num(p.border.widthIn) > 0 || r.borderLinearTotal === 0 },
    { id: "inchesConverted", label: "Inches converted to feet", pass: steps.every((s) => num(s.treadDepthIn) < 12 && num(s.riserHeightIn) < 12) },
    { id: "deductions", label: "Deducted areas verified", pass: true, manual: true },
    { id: "productDims", label: "Product dimensions verified", pass: num(p.bullnoseProduct.lengthIn) > 0 || r.totalBullnoseLinear === 0 },
    { id: "wasteSelected", label: "Waste percentage selected", pass: num(p.wastePct) > 0 },
    { id: "photos", label: "Photos attached", pass: (p.photos || []).length > 0, manual: true },
    { id: "sketch", label: "A field sketch was completed", pass: !!confirmed.sketch, manual: true },
    { id: "reviewed", label: "Measurements reviewed a second time", pass: !!confirmed.reviewed, manual: true },
  ];
  return checks;
}
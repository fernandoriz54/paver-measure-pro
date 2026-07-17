// Geometry helpers for the curved-path visualizer. All math is in FEET so the
// band stays true-to-scale; the visualizer multiplies by its px/ft scale.
// The measured centerline length and average width are NEVER derived from the
// curve — they come from the deduction's params. Curve data is visual-only.

export const CURVE_STYLES = [
  { value: "single", label: "Single bend" },
  { value: "scurve", label: "S-curve" },
  { value: "freeform", label: "Freeform" },
];

export function defaultCurve() {
  return {
    style: "single",
    amount: 0,          // -100..100  (negative = left/up bend, positive = right/down)
    rotation: 0,        // 0..359 whole-path rotation
    displayWidth: null, // null = linked to measured width
    visualWidthLinked: true,
    locked: false,      // lock curve handles
    lockPosition: false,
  };
}

export function ensureCurve(c) {
  return { ...defaultCurve(), ...(c || {}) };
}

// Maximum lateral bend in feet for amount=100. Keeps the curve readable.
const bendFeet = (amount, L) => (amount / 100) * (L * 0.35);

// Build the SVG path data + handle positions for a curved band.
export function curveGeometry(curve, L, W) {
  const c = ensureCurve(curve);
  const bandWidth = c.visualWidthLinked ? W : (c.displayWidth ?? W);
  const bend = bendFeet(c.amount, L);
  const absBend = Math.abs(bend);
  const pad = bandWidth / 2 + 0.5;
  const heightFt = 2 * absBend + 2 * pad;
  const midY = heightFt / 2;
  const start = { x: 0, y: midY };
  const end = { x: L, y: midY };

  let centerD = "";
  const handles = [];
  if (c.style === "scurve" || c.style === "freeform") {
    const c1 = { x: L * 0.25, y: midY - bend };
    const c2 = { x: L * 0.75, y: midY + bend };
    centerD = `M ${start.x} ${start.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${end.x} ${end.y}`;
    handles.push({ id: "h1", ...c1 });
    handles.push({ id: "h2", ...c2 });
  } else {
    const c1 = { x: L / 2, y: midY - bend };
    centerD = `M ${start.x} ${start.y} Q ${c1.x} ${c1.y} ${end.x} ${end.y}`;
    handles.push({ id: "h1", ...c1 });
  }
  return {
    bandWidth,
    heightFt,
    midY,
    start,
    end,
    centerD,
    handles,
    rotation: c.rotation,
  };
}

// Convert a dragged handle's feet-y back into a curve amount.
export function handleYToAmount(handleY, midY, L) {
  const bend = midY - handleY; // up (smaller y) => positive bend
  const amount = (bend / (L * 0.35)) * 100;
  return Math.max(-100, Math.min(100, Math.round(amount)));
}
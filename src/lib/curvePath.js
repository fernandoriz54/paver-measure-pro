// Geometry engine for the curved-path visualizer. All math is in FEET so the
// band stays true-to-scale; the visualizer multiplies by its px/ft scale.
//
// AUTHORITATIVE MEASUREMENTS live on the deduction/obstacle `params`:
//   params.linear  — measured centerline length (ft)
//   params.widths  — array of station widths (ft)
//   params.width   — average width (ft)
// These are NEVER derived from the curve. The `curve` object only stores the
// visual shape (handle points), view/lock/snap settings, and is normalized so
// its rendered centerline arc length equals the locked field measurement.

export const CURVE_STYLES = [
  { value: "single", label: "Single bend" },
  { value: "scurve", label: "S-curve" },
  { value: "freeform", label: "Freeform" },
];

export const SNAP_PRESETS = [
  { value: "off", label: "Off", ft: 0 },
  { value: "1in", label: "1 in", ft: 1 / 12 },
  { value: "3in", label: "3 in", ft: 3 / 12 },
  { value: "6in", label: "6 in", ft: 6 / 12 },
  { value: "1ft", label: "1 ft", ft: 1 },
];

export const UNIT_OPTIONS = [
  { value: "ft-dec", label: "Feet (dec)" },
  { value: "ft-in", label: "Feet + inches" },
  { value: "in", label: "Inches" },
  { value: "metric", label: "Metric" },
];

export const CURVE_VERSION = 3;

export function defaultCurve() {
  return {
    version: CURVE_VERSION,
    style: "single",
    amount: 0, // legacy single-value bend; migrated to `points`
    points: null, // [{x,y}] in feet — set on first render from amount/style
    rotation: 0, // whole-path visual rotation (deg)
    displayWidth: null, // null = linked to measured width
    visualWidthLinked: true,
    measurementLock: true, // measurements locked by default
    lockPosition: false,
    moveEndpoints: false, // allow moving start/end anchors
    snap: "off", // SNAP_PRESETS value
    fineAdjust: false,
    showGrid: true,
    showHandles: true,
    showDimensions: true,
    units: "ft-dec",
  };
}

// Versioned migration. v1 stored {style, amount}; v2 introduced `points`;
// v3 changed normalizeSplineLength to scale from the start anchor (so a bent
// path's rendered arc length can equal the measured length without forcing the
// endpoints 50 ft apart). Older saved curves are migrated forward safely and
// their points re-normalized on first use.
export function ensureCurve(c) {
  const base = defaultCurve();
  const merged = { ...base, ...(c || {}) };
  if (!merged.version || merged.version < CURVE_VERSION) {
    merged.version = CURVE_VERSION;
    // v1 curves with no points: keep them; buildPoints() synthesizes from amount.
    if (!Array.isArray(merged.points)) merged.points = null;
  }
  return merged;
}

// Build the centerline control points for a curve of measured length L.
// The start anchor is always (0,0). The end anchor is (L,0) as a chord
// reference, but normalizeSplineLength (when locked) uniformly scales the
// whole curve from the start anchor so the rendered ARC length equals L —
// which lets the ending chord shorten as the path bends.
export function buildPoints(curve, L) {
  const c = ensureCurve(curve);
  if (Array.isArray(c.points) && c.points.length >= 2) {
    return c.points.map((p, i) => {
      if (i === 0) return { x: 0, y: 0 };
      if (i === c.points.length - 1) return { x: L, y: 0 };
      return { x: p.x, y: p.y };
    });
  }
  // migrate from legacy amount/style
  const bend = ((c.amount || 0) / 100) * (L * 0.35);
  if (c.style === "scurve" || c.style === "freeform") {
    return [
      { x: 0, y: 0 },
      { x: L * 0.25, y: -bend },
      { x: L * 0.75, y: bend },
      { x: L, y: 0 },
    ];
  }
  return [
    { x: 0, y: 0 },
    { x: L / 2, y: -bend },
    { x: L, y: 0 },
  ];
}

// Catmull-Rom spline through `points` → array of cubic Bézier segments.
// Each segment: { p0, p1, p2, p3 }. Endpoints are clamped (duplicated tangents).
export function splineToBeziers(points, tension = 0.5) {
  if (points.length < 2) return [];
  if (points.length === 2) {
    return [{ p0: points[0], p1: points[0], p2: points[1], p3: points[1] }];
  }
  const segs = [];
  const k = tension; // 0.5 = standard Catmull-Rom
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || points[i + 1];
    segs.push({
      p0: p1,
      p1: { x: p1.x + (p2.x - p0.x) * k / 6, y: p1.y + (p2.y - p0.y) * k / 6 },
      p2: { x: p2.x - (p3.x - p1.x) * k / 6, y: p2.y - (p3.y - p1.y) * k / 6 },
      p3: p2,
    });
  }
  return segs;
}

function bezPoint(seg, t) {
  const mt = 1 - t;
  const x = mt * mt * mt * seg.p0.x + 3 * mt * mt * t * seg.p1.x + 3 * mt * t * t * seg.p2.x + t * t * t * seg.p3.x;
  const y = mt * mt * mt * seg.p0.y + 3 * mt * mt * t * seg.p1.y + 3 * mt * t * t * seg.p2.y + t * t * t * seg.p3.y;
  return { x, y };
}

// Split a cubic Bézier at t into two cubic Bézier segments (de Casteljau).
function splitBezier(seg, t) {
  const { p0, p1, p2, p3 } = seg;
  // level 1
  const q0 = { x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t };
  const q1 = { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t };
  const q2 = { x: p2.x + (p3.x - p2.x) * t, y: p2.y + (p3.y - p2.y) * t };
  // level 2
  const r0 = { x: q0.x + (q1.x - q0.x) * t, y: q0.y + (q1.y - q0.y) * t };
  const r1 = { x: q1.x + (q2.x - q1.x) * t, y: q1.y + (q2.y - q1.y) * t };
  // level 3 — the point on the curve at t
  const m = { x: r0.x + (r1.x - r0.x) * t, y: r0.y + (r1.y - r0.y) * t };
  return {
    a: { p0, p1: q0, p2: r0, p3: m },
    b: { p0: m, p1: r1, p2: q2, p3 },
  };
}

// Arc length of one cubic Bézier via adaptive de Casteljau subdivision.
// Subdivide until the control points are nearly collinear with the chord; the
// chord is then an excellent length approximation. eps is in feet; depth caps
// recursion so a wildly tight curve can't blow up. 2^16 leaves is plenty for
// sub-0.001 ft accuracy on field-scale paths.
export function segLength(seg, eps = 1e-3, depth = 0) {
  const chord = Math.hypot(seg.p3.x - seg.p0.x, seg.p3.y - seg.p0.y);
  const polyDist = Math.hypot(
    3 * seg.p1.x - 2 * seg.p0.x - seg.p3.x,
    3 * seg.p1.y - 2 * seg.p0.y - seg.p3.y
  ) + Math.hypot(
    3 * seg.p2.x - 2 * seg.p3.x - seg.p0.x,
    3 * seg.p2.y - 2 * seg.p3.y - seg.p0.y
  );
  if (polyDist <= eps || depth >= 16) return chord;
  const { a, b } = splitBezier(seg, 0.5);
  return segLength(a, eps, depth + 1) + segLength(b, eps, depth + 1);
}

export function splineLength(segs, eps = 0.01) {
  return segs.reduce((s, seg) => s + segLength(seg, eps), 0);
}

// Reparameterize: cumulative arc-length lookup table over the spline.
export function arcLengthTable(segs, eps = 0.01) {
  const table = [{ s: 0, seg: 0, t: 0, pt: segs[0].p0 }];
  let acc = 0;
  for (let i = 0; i < segs.length; i++) {
    const steps = 24;
    let prev = segs[i].p0;
    for (let j = 1; j <= steps; j++) {
      const t = j / steps;
      const pt = bezPoint(segs[i], t);
      acc += Math.hypot(pt.x - prev.x, pt.y - prev.y);
      table.push({ s: acc, seg: i, t, pt });
      prev = pt;
    }
  }
  return table;
}

// Point + unit tangent at arc-length distance `dist` along the spline.
export function pointAtArcLength(table, dist) {
  if (!table.length) return { x: 0, y: 0, tx: 1, ty: 0 };
  const total = table[table.length - 1].s;
  const d = Math.max(0, Math.min(total, dist));
  let lo = 0, hi = table.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (table[mid].s < d) lo = mid; else hi = mid;
  }
  const a = table[lo], b = table[hi] || a;
  const span = b.s - a.s || 1;
  const f = (d - a.s) / span;
  const x = a.pt.x + (b.pt.x - a.pt.x) * f;
  const y = a.pt.y + (b.pt.y - a.pt.y) * f;
  const tx = b.pt.x - a.pt.x;
  const ty = b.pt.y - a.pt.y;
  const len = Math.hypot(tx, ty) || 1;
  return { x, y, tx: tx / len, ty: ty / len };
}

// Scale the ENTIRE curve uniformly from the start anchor so the spline's
// rendered arc length converges to `target` (the locked measured length).
// The start anchor (0,0) stays fixed; every other point — including the end
// anchor — is scaled by the same factor. This is what lets a bent 50 ft path
// actually render at 50 ft of arc: the ending chord shortens as the path
// bends, instead of being pinned 50 ft apart (which made 50 ft of arc
// impossible for anything but a straight line).
export function normalizeSplineLength(points, target, eps = 1e-3) {
  let pts = points.map((p) => ({ ...p }));
  if (!pts.length || target <= 0) return pts;
  // Anchor is always the start point.
  const anchor = { x: pts[0].x, y: pts[0].y };
  const tol = target >= 100 ? 0.005 : 0.001;
  for (let iter = 0; iter < 20; iter++) {
    const segs = splineToBeziers(pts);
    const len = splineLength(segs, eps);
    if (Math.abs(len - target) <= tol) break;
    const factor = target / (len || 1);
    pts = pts.map((p) => ({
      x: anchor.x + (p.x - anchor.x) * factor,
      y: anchor.y + (p.y - anchor.y) * factor,
    }));
  }
  // Re-pin the start anchor exactly (guard against float drift).
  pts[0] = { x: anchor.x, y: anchor.y };
  return pts;
}

// Width stations along the centerline, derived from authoritative field widths.
// Evenly distributed by distance. Returns [{ dist, width }].
export function widthStations(widths, L) {
  const w = Array.isArray(widths) && widths.length ? widths.map((v) => parseFloat(v) || 0) : [0];
  if (w.length === 1) return [{ dist: 0, width: w[0] }, { dist: L, width: w[0] }];
  return w.map((width, i) => ({ dist: (i / (w.length - 1)) * L, width }));
}

function interpWidth(stations, dist) {
  if (stations.length === 1) return stations[0].width;
  if (dist <= stations[0].dist) return stations[0].width;
  if (dist >= stations[stations.length - 1].dist) return stations[stations.length - 1].width;
  for (let i = 0; i < stations.length - 1; i++) {
    if (dist >= stations[i].dist && dist <= stations[i + 1].dist) {
      const span = stations[i + 1].dist - stations[i].dist || 1;
      const f = (dist - stations[i].dist) / span;
      return stations[i].width + (stations[i + 1].width - stations[i].width) * f;
    }
  }
  return stations[stations.length - 1].width;
}

// Build the offset band boundaries + dimension lines + sampled centerline.
// Sampling scales with path length (more samples for longer paths) to keep
// offset boundaries and geometry-area accurate, capped at 512 samples.
export function buildBand(segs, stations, L, samples) {
  const table = arcLengthTable(segs);
  const total = table[table.length - 1].s;
  const n = Math.max(24, Math.min(512, samples ?? Math.ceil(Math.max(total, L) * 8)));
  const left = [], right = [], center = [];
  const dimLines = stations.map((st) => {
    const p = pointAtArcLength(table, Math.min(st.dist, total));
    const nx = -p.ty, ny = p.tx; // perpendicular normal
    const hw = st.width / 2;
    return {
      a: { x: p.x + nx * hw, y: p.y + ny * hw },
      b: { x: p.x - nx * hw, y: p.y - ny * hw },
      width: st.width,
      dist: st.dist,
    };
  });
  for (let i = 0; i <= n; i++) {
    const d = (n <= 0 ? 0 : (i / n) * total);
    const p = pointAtArcLength(table, d);
    const nx = -p.ty, ny = p.tx;
    const w = interpWidth(stations, d);
    const hw = w / 2;
    center.push({ x: p.x, y: p.y });
    left.push({ x: p.x + nx * hw, y: p.y + ny * hw });
    right.push({ x: p.x - nx * hw, y: p.y - ny * hw });
  }
  return { left, right, center, dimLines, totalLen: total };
}

// Polygon area via the shoelace formula (absolute), in sq ft.
export function polygonArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    a += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return Math.abs(a) / 2;
}

// Geometry-estimated area from the rendered band polygon.
export function geometryArea(band) {
  const poly = [...band.left, ...band.right.slice().reverse()];
  return polygonArea(poly);
}

// Field-estimated area via trapezoidal integration of width stations.
export function fieldAreaFromStations(stations, L) {
  if (!stations.length) return 0;
  if (stations.length === 1) return stations[0].width * L;
  let a = 0;
  for (let i = 0; i < stations.length - 1; i++) {
    const d = stations[i + 1].dist - stations[i].dist;
    a += ((stations[i].width + stations[i + 1].width) / 2) * d;
  }
  return a;
}

// Find the arc-length position on the centerline nearest to a target local
// point (in feet). Returns { dist, point }. Used for inserting a new handle at
// the nearest sampled centerline position instead of by x-coordinate only.
export function nearestCenterlinePoint(segs, target, samples = 256) {
  const table = arcLengthTable(segs);
  if (!table.length) return { dist: 0, point: { x: 0, y: 0 } };
  let bestDist = Infinity, best = table[0];
  for (let i = 0; i <= samples; i++) {
    const s = (i / samples) * (table[table.length - 1].s || 0);
    const p = pointAtArcLength(table, s);
    const d = (p.x - target.x) ** 2 + (p.y - target.y) ** 2;
    if (d < bestDist) { bestDist = d; best = { dist: s, point: { x: p.x, y: p.y } }; }
  }
  return best;
}

// Snap a feet value to the configured increment (off → unchanged).
export function snapFeet(v, snapKey) {
  const preset = SNAP_PRESETS.find((p) => p.value === snapKey);
  if (!preset || !preset.ft) return v;
  return Math.round(v / preset.ft) * preset.ft;
}

// Format a feet value for display per the chosen unit setting.
export function formatDim(v, units = "ft-dec") {
  const n = Number(v) || 0;
  if (units === "in") return `${(n * 12).toFixed(1)} in`;
  if (units === "metric") return `${(n * 0.3048).toFixed(2)} m`;
  if (units === "ft-in") {
    const ft = Math.floor(n);
    const inch = Math.round((n - ft) * 12);
    return inch === 12 ? `${ft + 1} ft 0 in` : `${ft} ft ${inch} in`;
  }
  return `${n.toFixed(2)} ft`;
}

// Full geometry for a curved path, combining the authoritative params + curve.
// Field measurements (L, W, widths, fieldArea, deductions) are ALWAYS
// authoritative — bending only reshapes the visual; normalizeSplineLength
// keeps the rendered arc length equal to L so a locked 50 ft × 4 ft path
// stays exactly 200 sq ft regardless of its bends.
export function curveGeometry(curve, L, W, widths) {
  const c = ensureCurve(curve);
  const bandW = c.visualWidthLinked ? W : (c.displayWidth ?? W);
  const rawPoints = buildPoints(c, L);
  const points = c.measurementLock
    ? normalizeSplineLength(rawPoints, L)
    : rawPoints;
  const segs = splineToBeziers(points);
  const stations = widthStations(widths && widths.length ? widths : [bandW], L);
  const band = buildBand(segs, stations, L);
  const renderedLen = band.totalLen;
  const fieldA = fieldAreaFromStations(stations, L);

  // bounds for the SVG viewBox + container size
  const all = [...band.left, ...band.right, ...points];
  const pad = bandW / 2 + 0.6;
  const minX = Math.min(...all.map((p) => p.x)) - pad;
  const maxX = Math.max(...all.map((p) => p.x)) + pad;
  const minY = Math.min(...all.map((p) => p.y)) - pad;
  const maxY = Math.max(...all.map((p) => p.y)) + pad;

  return {
    points,
    segs,
    band,
    stations,
    bandWidth: bandW,
    renderedLen,
    measuredLen: L,
    fieldArea: fieldA,
    geometryArea: geometryArea(band),
    bounds: { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY },
    rotation: c.rotation || 0,
    warning: c.measurementLock && Math.abs(renderedLen - L) > (L >= 100 ? 0.05 : 0.01),
  };
}
// Shared helpers for turning saved Builder sections into visualizer params and
// recomputing area/perimeter from raw measurements. Used by ProjectDetail and
// PlanViewer so totals always match.

export function sectionToViz(s) {
  const m = s.measurements || {};
  const base = { id: String(s.id), label: s.label, name: s.name };
  switch (s.shape) {
    case "rectangle": return { ...base, type: "rectangle", params: { length: parseFloat(m.lengthFt) || 0, width: parseFloat(m.widthFt) || 0 } };
    case "circle": return { ...base, type: "circle", params: { radius: (parseFloat(m.diameter) || 0) / 2 } };
    case "triangle": return { ...base, type: "triangle", params: { base: parseFloat(m.baseFt) || 0, height: parseFloat(m.heightFt) || 0 } };
    case "trapezoid": return { ...base, type: "trapezoid", params: { a: parseFloat(m.sideA) || 0, b: parseFloat(m.sideB) || 0, height: parseFloat(m.heightFt) || 0 } };
    default: return { ...base, type: "rectangle", params: { length: 0, width: 0 } };
  }
}

export function computeSection(section) {
  const m = section.measurements || {};
  const num = (v) => parseFloat(v) || 0;
  let area = 0, perimeter = 0, formula = "";
  switch (section.shape) {
    case "rectangle":
      area = num(m.lengthFt) * num(m.widthFt);
      perimeter = 2 * (num(m.lengthFt) + num(m.widthFt));
      formula = `${num(m.lengthFt)} × ${num(m.widthFt)} = ${area.toFixed(2)}`;
      break;
    case "circle":
      area = Math.PI * Math.pow(num(m.diameter) / 2, 2);
      perimeter = Math.PI * num(m.diameter);
      formula = `π × (${num(m.diameter)}/2)² = ${area.toFixed(2)}`;
      break;
    case "triangle":
      area = 0.5 * num(m.baseFt) * num(m.heightFt);
      formula = `½ × ${num(m.baseFt)} × ${num(m.heightFt)} = ${area.toFixed(2)}`;
      break;
    case "trapezoid":
      area = 0.5 * (num(m.sideA) + num(m.sideB)) * num(m.heightFt);
      formula = `½ × (${num(m.sideA)} + ${num(m.sideB)}) × ${num(m.heightFt)} = ${area.toFixed(2)}`;
      break;
    default: break;
  }
  return { area, perimeter, formula };
}
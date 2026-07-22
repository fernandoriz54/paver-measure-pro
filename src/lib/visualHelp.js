// Visual Help content registry. Keyed by calculator helpId.
// Each entry powers the optional "Show Me How to Measure" overlay.
// Plain-language, field-equipment referenced (measuring wheel + 25 ft tape).

const FIELD_TOOLS = "Recommended tools: 25 ft tape for short runs, measuring wheel for long runs.";

export const VISUAL_HELP = {
  rectangle: {
    diagramType: "rectangle",
    where: "Hook the tape at one corner and pull it straight along the longest side for Length. Then measure the perpendicular side for Width — corner to corner.",
    explanation: `Area = Length × Width. ${FIELD_TOOLS}`,
    mistake: "Measuring to a curve or angled edge instead of the true square corners — use the longest straight sides so you don't short the material.",
  },
  square: {
    diagramType: "square",
    where: "Measure any one side from corner to corner. All four sides are equal on a square.",
    explanation: `Area = Side × Side. ${FIELD_TOOLS}`,
    mistake: "Assuming it's square — verify two adjacent sides are equal before using one measurement.",
  },
  triangle: {
    diagramType: "triangle",
    where: "Measure the Base along the bottom edge, then measure straight up to the highest point for the Height (perpendicular to the base).",
    explanation: "Area = Base × Height ÷ 2.",
    mistake: "Measuring the slanted side instead of the straight-up height — the height must be perpendicular to the base.",
  },
  circle: {
    diagramType: "circle",
    where: "Measure straight across the widest part, through the center, for the Diameter. Radius is half the diameter.",
    explanation: "Area = π × Radius². Circumference = Diameter × π.",
    mistake: "Measuring around the outside and calling it the diameter — that's the circumference, not the area input.",
  },
  turf: {
    diagramType: "turf",
    where: "Measure the full lawn Length × Width for gross area. Then measure each thing inside it you keep (concrete, planters, tree wells) and subtract.",
    explanation: "Net = Gross − deductions. Add waste for cuts & seams.",
    mistake: "Forgetting to subtract existing concrete or planters — you'll order too much turf.",
  },
  walkway: {
    diagramType: "path",
    where: "Roll the measuring wheel down the centerline for Length. Measure the Width straight across.",
    explanation: "Area = Length × Width. For a curved path, the wheel along the centerline keeps the length accurate.",
    mistake: "Measuring the curve on the outside edge — that overstates the length. Always use the centerline.",
  },
  driveway: {
    diagramType: "driveway",
    where: "Measure the width at the garage and the width at the street, plus the depth down the middle. For a tapered drive, average the two widths.",
    explanation: "Tapered area = (top width + bottom width) ÷ 2 × depth.",
    mistake: "Using only one width on a flared driveway — measure both ends and average them.",
  },
  border: {
    diagramType: "border",
    where: "Measure the full edge length you'll border (perimeter). The border width is how far the border sticks in from that edge.",
    explanation: "Linear ft × border width × rows = border square footage.",
    mistake: "Forgetting to subtract gates or gaps where there's no border.",
  },
  paver: {
    diagramType: "rectangle",
    where: "Start with the total project area, then enter areas done by other products (border, accent) so they're removed from the main field.",
    explanation: "Net field = Total − deductions − border − accent. Add waste for cuts.",
    mistake: "Counting the border area twice — once in the total and once as a separate border.",
  },
  material: {
    diagramType: "generic",
    where: "Enter the area (or linear footage) you need to cover, pick the product, and the pieces & pallets calculate automatically.",
    explanation: "Pieces = area with waste ÷ sq ft per piece (rounded up).",
    mistake: "Ordering exact area with no waste — always include the waste percentage for cuts.",
  },
  irregular: {
    diagramType: "generic",
    where: "Break the shape into simple sections (rectangles, triangles, circles). Label them A, B, C and measure each separately.",
    explanation: "Total = sum of all sections, minus any obstacles.",
    mistake: "Trying to measure one big irregular outline — split it into shapes you can calculate.",
  },
  combined: {
    diagramType: "generic",
    where: "Add a section per area. Pick its shape, enter measurements inline, then deduct obstacles per section.",
    explanation: "Each section shows gross, deductions and net — all roll up to the project total.",
    mistake: "Mixing obstacles from one section into another — deduct each obstacle against its own section.",
  },
  steps: {
    diagramType: "steps",
    where: "Count the steps, measure total height (bottom to top), step width, and tread depth. Add a landing if present.",
    explanation: "Rise per step = total height ÷ steps. Bullnose = step width × number of steps.",
    mistake: "Measuring tread depth as one step only — multiply by the number of steps for total run.",
  },
  walls: {
    diagramType: "walls",
    where: "Measure the wall Length along the face and the Height from ground to top of cap. Add a segment for each direction change (L, U shapes).",
    explanation: "Face area = Length × Height. Cap & exposed ends add linear footage.",
    mistake: "Forgetting exposed ends and corners — they need cap pieces too.",
  },
  entrance: {
    diagramType: "generic",
    where: "Measure the walkway, porch, landing and each step. Enter bullnose edges and any additional edges separately.",
    explanation: "Each section rolls into one entrance total with bullnose & border.",
    mistake: "Missing the side returns on steps — measure left and right returns, not just the front edge.",
  },
  unit: {
    diagramType: "generic",
    where: "Type any value in one unit; all related units convert instantly.",
    explanation: "A pure conversion tool — no project data needed.",
    mistake: "Mixing feet-and-inches with decimal feet — pick one mode per field.",
  },
};

export const getHelp = (id) => VISUAL_HELP[id] || null;
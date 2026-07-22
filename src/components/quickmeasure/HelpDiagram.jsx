import React from "react";

// Simple, clean construction-style SVG diagrams for the Visual Help panel.
// type: rectangle | square | triangle | circle | path | border | turf | driveway | steps | walls | generic
export default function HelpDiagram({ type = "generic" }) {
  const W = 220, H = 150, C = "#0f766e", D = "#1e293b", A = "#ea580c";
  const dim = (x1, y1, x2, y2, label, anchor = "middle") => (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={A} strokeWidth={1.5} strokeDasharray="4 3" />
      <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 4} textAnchor={anchor} fontSize={10} fill={A} fontWeight="bold">{label}</text>
    </g>
  );

  switch (type) {
    case "rectangle":
    case "turf":
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          <rect x="35" y="25" width="150" height="90" fill="#e2e8f0" stroke={C} strokeWidth={2} />
          {dim(35, 14, 185, 14, "Length")}
          {dim(24, 25, 24, 115, "Width", "end")}
        </svg>
      );
    case "square":
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          <rect x="55" y="20" width="110" height="110" fill="#e2e8f0" stroke={C} strokeWidth={2} />
          {dim(55, 10, 165, 10, "Side")}
        </svg>
      );
    case "triangle":
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          <polygon points="30,120 190,120 110,30" fill="#e2e8f0" stroke={C} strokeWidth={2} />
          {dim(30, 132, 190, 132, "Base")}
          {dim(112, 30, 112, 120, "Height", "end")}
        </svg>
      );
    case "circle":
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          <circle cx="110" cy="75" r="55" fill="#e2e8f0" stroke={C} strokeWidth={2} />
          <line x1="55" y1="75" x2="165" y2="75" stroke={A} strokeWidth={1.5} strokeDasharray="4 3" />
          <text x="110" y="70" textAnchor="middle" fontSize={10} fill={A} fontWeight="bold">Diameter</text>
        </svg>
      );
    case "path":
    case "walkway":
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          <rect x="30" y="50" width="160" height="45" fill="#e2e8f0" stroke={C} strokeWidth={2} />
          {dim(30, 40, 190, 40, "Length")}
          {dim(22, 50, 22, 95, "Width", "end")}
        </svg>
      );
    case "border":
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          <rect x="35" y="35" width="150" height="80" fill="none" stroke={C} strokeWidth={6} />
          {dim(35, 24, 185, 24, "Total length")}
          <text x="110" y="135" textAnchor="middle" fontSize={9} fill={D}>Border width = distance from edge inward</text>
        </svg>
      );
    case "driveway":
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          <polygon points="35,30 185,55 185,120 35,95" fill="#e2e8f0" stroke={C} strokeWidth={2} />
          {dim(35, 20, 35, 20, "")}
          <text x="110" y="18" textAnchor="middle" fontSize={9} fill={A} fontWeight="bold">Top width</text>
          <text x="110" y="142" textAnchor="middle" fontSize={9} fill={A} fontWeight="bold">Bottom width</text>
          {dim(196, 30, 196, 120, "Depth", "end")}
        </svg>
      );
    case "steps":
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          {[0, 1, 2].map((i) => (
            <rect key={i} x={30 + i * 45} y={110 - i * 22} width="42" height={22} fill="#e2e8f0" stroke={C} strokeWidth={2} />
          ))}
          {dim(30, 138, 165, 138, "Total run")}
          {dim(20, 44, 20, 132, "Height", "end")}
        </svg>
      );
    case "walls":
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          <rect x="35" y="30" width="150" height="90" fill="#e2e8f0" stroke={C} strokeWidth={2} />
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1="35" y1={45 + i * 18} x2="185" y2={45 + i * 18} stroke={C} strokeWidth={1} opacity="0.5" />
          ))}
          {dim(35, 20, 185, 20, "Length")}
          {dim(24, 30, 24, 120, "Height", "end")}
        </svg>
      );
    default:
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          <rect x="35" y="25" width="150" height="90" fill="#e2e8f0" stroke={C} strokeWidth={2} />
          <text x="110" y="145" textAnchor="middle" fontSize={9} fill={D}>Measure the longest & widest points</text>
        </svg>
      );
  }
}
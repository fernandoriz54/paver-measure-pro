import React from "react";
import { Footprints } from "lucide-react";
import AreaCalc from "./AreaCalc";

export default function WalkwayCalc() {
  return <AreaCalc title="Walkway & Patio" subtitle="Multiple widths allowed" icon={Footprints} checklist={[]} />;
}
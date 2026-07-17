import React from "react";
import { Car } from "lucide-react";
import AreaCalc from "./AreaCalc";

const CHECKLIST = [
  "Measure both lengths",
  "Measure both widths",
  "Measure garage-door width",
  "Measure street-side width",
  "Record slopes",
  "Record drains",
  "Record utility covers",
  "Record transitions",
  "Record vehicle access",
  "Record existing concrete thickness (if known)",
];

export default function DrivewayCalc() {
  return <AreaCalc title="Driveway Calculator" subtitle="Divide into sections + checklist" icon={Car} checklist={CHECKLIST} />;
}
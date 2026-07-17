import React from "react";
import { Trees } from "lucide-react";
import AreaCalc from "./AreaCalc";

export default function LawnCalc() {
  return <AreaCalc title="Lawn Calculator" subtitle="Area = Length × Width" icon={Trees} checklist={[]} />;
}
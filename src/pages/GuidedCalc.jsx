import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getGuidedConfig } from "@/lib/guidedConfigs";
import GuidedMeasurement from "@/components/guided/GuidedMeasurement";

export default function GuidedCalc() {
  const { configId } = useParams();
  const navigate = useNavigate();
  const config = getGuidedConfig(configId);
  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600 font-semibold">Guided calculator not found.</p>
          <button onClick={() => navigate("/")} className="mt-3 text-emerald-700 font-bold">Back home</button>
        </div>
      </div>
    );
  }
  return <GuidedMeasurement config={config} onExit={() => navigate("/")} />;
}
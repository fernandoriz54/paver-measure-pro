import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Save, HelpCircle, ChevronRight } from "lucide-react";
import GuidedDiagram from "./GuidedDiagram";
import HelpCard from "./HelpCard";
import ReviewPanel from "./ReviewPanel";
import SegmentEditor from "./SegmentEditor";
import MeasurementInput from "@/components/MeasurementInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Universal guided calculator scaffold.
// config: { id, title, subtitle, icon, typeChoices, getSteps(typeId, values), compute(typeId, values) }
export default function GuidedMeasurement({ config, onExit }) {
  const navigate = useNavigate();
  const Icon = config.icon;
  const storeKey = `guided:${config.id}`;

  const [mode, setMode] = useState("guided"); // 'guided' | 'advanced'
  const [phase, setPhase] = useState("type"); // 'type' | 'measure' | 'review'
  const [typeId, setTypeId] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState({});
  const [showHelp, setShowHelp] = useState(false);
  const [verified, setVerified] = useState(false);

  // Hydrate / autosave to sessionStorage (resume unfinished measurement).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storeKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.typeId) {
          setTypeId(saved.typeId);
          setValues(saved.values || {});
          setPhase(saved.phase || "measure");
          setStepIndex(saved.stepIndex || 0);
          setMode(saved.mode || "guided");
        }
      }
    } catch {}
  }, [storeKey]);

  useEffect(() => {
    if (phase !== "type") {
      try {
        sessionStorage.setItem(storeKey, JSON.stringify({ typeId, values, phase, stepIndex, mode }));
      } catch {}
    }
  }, [storeKey, typeId, values, phase, stepIndex, mode]);

  const typeChoice = useMemo(() => config.typeChoices.find((t) => t.id === typeId) || null, [config, typeId]);
  const steps = useMemo(() => (typeId ? config.getSteps(typeId, values) : []), [config, typeId, values]);
  const currentStep = steps[stepIndex];
  const results = useMemo(() => (typeId ? config.compute(typeId, values) : null), [config, typeId, values]);

  const setField = (field, val) => setValues((p) => ({ ...p, [field]: val }));

  const chooseType = (id) => {
    setTypeId(id);
    setValues({});
    setStepIndex(0);
    setPhase("measure");
    setVerified(false);
  };

  const next = () => {
    if (stepIndex < steps.length - 1) setStepIndex((i) => i + 1);
    else setPhase("review");
    setShowHelp(false);
  };
  const prev = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
    else setPhase("type");
    setShowHelp(false);
  };

  const exit = () => {
    try { sessionStorage.removeItem(storeKey); } catch {}
    if (onExit) onExit();
    else navigate(-1);
  };

  const totalSteps = steps.length + 1; // +1 for review
  const stepNumber = phase === "review" ? totalSteps : stepIndex + 1;

  // ---------- TYPE CHOICE SCREEN ----------
  if (phase === "type") {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <Header Icon={Icon} title={config.title} subtitle={config.subtitle} onBack={exit} right={null} />
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h2 className="text-base font-bold text-slate-700 mb-1">What are you measuring?</h2>
          <p className="text-sm text-slate-500 mb-4">Pick the closest visual example.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {config.typeChoices.map((t) => (
              <button key={t.id} onClick={() => chooseType(t.id)}
                className="text-left bg-white rounded-2xl border border-slate-200 shadow-sm p-3 active:scale-95 transition flex gap-3 items-start">
                <div className="w-16 h-16 shrink-0 rounded-xl bg-slate-100 overflow-hidden">
                  <GuidedDiagram diagram={t.diagram} values={{}} highlight={null} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-800 text-sm">{t.label}</div>
                  <div className="text-xs text-slate-500 mb-2">{t.blurb}</div>
                  <span className="inline-block bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded-lg">Start Measuring</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---------- ADVANCED MODE (all inputs together) ----------
  const renderInput = (step) => {
    if (step.inputType === "length") {
      return <MeasurementInput label={`${step.question}`} value={values[step.field]} onChange={(v) => setField(step.field, v)} hint={step.unit === "sq ft" ? "Enter square feet as decimal" : undefined} />;
    }
    if (step.inputType === "integer") {
      return (
        <div>
          <Label className="text-base font-semibold">{step.question}</Label>
          <Input type="number" inputMode="numeric" placeholder={step.placeholder} value={values[step.field] ?? ""} onChange={(e) => setField(step.field, Number(e.target.value))} className="h-14 text-lg mt-1" />
        </div>
      );
    }
    if (step.inputType === "segments") {
      return <SegmentEditor label={step.question} value={values[step.field]} onChange={(v) => setField(step.field, v)} count={Math.round(values.numSegments || 0)} />;
    }
    if (step.inputType === "select") {
      return (
        <div>
          <Label className="text-base font-semibold">{step.question}</Label>
          <Select value={String(values[step.field] ?? "")} onValueChange={(v) => setField(step.field, isNaN(Number(v)) ? v : Number(v))}>
            <SelectTrigger className="h-12 text-base mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {step.options.map((o) => <SelectItem key={String(o.value)} value={String(o.value)}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      );
    }
    return null;
  };

  // ---------- MAIN RENDER (measure or review) ----------
  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <Header
        Icon={Icon}
        title={config.title}
        subtitle={typeChoice?.label}
        onBack={phase === "review" ? () => setPhase("measure") : prev}
        right={
          <div className="flex items-center gap-2">
            <div className="bg-emerald-900/40 rounded-lg px-2 py-1 text-xs font-bold">Step {stepNumber} of {totalSteps}</div>
            <ModeToggle mode={mode} setMode={setMode} />
            <button onClick={exit} className="bg-emerald-900/40 rounded-lg p-2" aria-label="Save & Exit"><Save size={18} /></button>
          </div>
        }
      />

      <div className="max-w-2xl mx-auto px-4 py-4">
        {phase === "review" ? (
          <ReviewPanel
            config={config}
            typeId={typeChoice?.label}
            values={values}
            results={results}
            verified={verified}
            onToggleVerified={() => setVerified((v) => !v)}
            onEdit={() => { setPhase("measure"); setStepIndex(0); }}
            onDuplicate={() => { setValues({}); setStepIndex(0); setPhase("measure"); setVerified(false); }}
            onAddAnother={() => { setTypeId(null); setValues({}); setPhase("type"); setVerified(false); }}
          />
        ) : mode === "advanced" ? (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-3">
              <GuidedDiagram diagram={typeChoice?.diagram} values={values} highlight={null} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {steps.map((s) => <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-3">{renderInput(s)}</div>)}
            </div>
            <button onClick={() => setPhase("review")} className="w-full bg-emerald-700 text-white rounded-xl py-4 font-bold text-lg active:scale-95 flex items-center justify-center gap-2">
              Review Calculations <ChevronRight size={20} />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Center: visual example + live preview */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3">
              <GuidedDiagram diagram={currentStep?.diagram || typeChoice?.diagram} values={values} highlight={currentStep?.highlight} />
            </div>

            {/* Help */}
            {showHelp && currentStep?.help && <HelpCard help={currentStep.help} />}

            {/* Bottom: one question + input */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-bold text-slate-800 leading-snug">{currentStep?.question}</h3>
                {currentStep?.help && (
                  <button onClick={() => setShowHelp((s) => !s)} className="shrink-0 flex items-center gap-1 text-amber-700 text-xs font-semibold bg-amber-50 border border-amber-300 rounded-lg px-2.5 py-1.5">
                    <HelpCircle size={15} /> {showHelp ? "Hide help" : "Not sure?"}
                  </button>
                )}
              </div>
              {renderInput(currentStep)}
              <p className="text-xs text-slate-400">Field Measured — stored at full precision. Dragging or zooming the visual never changes this value.</p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Previous / Continue */}
      {phase === "measure" && (
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3">
          <div className="max-w-2xl mx-auto flex gap-3">
            <button onClick={prev} className="flex items-center gap-1 px-5 py-3.5 rounded-xl border border-slate-300 text-slate-700 font-bold active:scale-95">
              <ChevronLeft size={18} /> Prev
            </button>
            <button onClick={next} className="flex-1 flex items-center justify-center gap-1 bg-emerald-700 text-white rounded-xl py-3.5 font-bold text-lg active:scale-95">
              Continue <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Header({ Icon, title, subtitle, onBack, right }) {
  return (
    <div className="sticky top-0 z-20 bg-emerald-800 text-white px-4 py-3 flex items-center gap-3 shadow-md">
      <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-emerald-700 transition" aria-label="Back">
        <ChevronLeft size={24} />
      </button>
      <div className="flex items-center gap-2 flex-1">
        {Icon && <Icon size={22} />}
        <div>
          <h1 className="text-lg font-bold leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-emerald-100 leading-tight">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

function ModeToggle({ mode, setMode }) {
  return (
    <div className="bg-emerald-900/40 rounded-lg p-0.5 flex">
      <button onClick={() => setMode("guided")} className={`text-xs font-bold px-2.5 py-1.5 rounded-md ${mode === "guided" ? "bg-white text-emerald-800" : "text-white"}`}>Guided</button>
      <button onClick={() => setMode("advanced")} className={`text-xs font-bold px-2.5 py-1.5 rounded-md ${mode === "advanced" ? "bg-white text-emerald-800" : "text-white"}`}>Advanced</button>
    </div>
  );
}
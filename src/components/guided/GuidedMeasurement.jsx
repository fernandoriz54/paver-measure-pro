import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, HelpCircle, ChevronRight, Check, Delete, Clock } from "lucide-react";
import GuidedDiagram from "./GuidedDiagram";
import HelpCard from "./HelpCard";
import ReviewPanel from "./ReviewPanel";
import SegmentEditor from "./SegmentEditor";
import VisualExampleSelector from "./VisualExampleSelector";
import MeasurementInput from "@/components/MeasurementInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { runVerification, computeConfidence, sectionStatus, STATUS_ORDER } from "@/lib/verification";

// Universal guided calculator scaffold (Field Mode).
export default function GuidedMeasurement({ config, onExit }) {
  const navigate = useNavigate();
  const Icon = config.icon;
  const storeKey = `guided:${config.id}`;

  const [phase, setPhase] = useState("type"); // 'type' | 'measure' | 'review'
  const [typeId, setTypeId] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState({});
  const [showHelp, setShowHelp] = useState(false);
  const [verified, setVerified] = useState(false);
  const [acknowledged, setAcknowledged] = useState({});
  const [checklist, setChecklist] = useState({});

  // Offline-safe local draft recovery (sessionStorage survives refresh).
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
          setVerified(!!saved.verified);
          setAcknowledged(saved.acknowledged || {});
        }
      }
    } catch {}
  }, [storeKey]);

  // Debounced autosave (battery-conscious: only writes when values settle).
  useEffect(() => {
    if (phase === "type") return;
    const t = setTimeout(() => {
      try { sessionStorage.setItem(storeKey, JSON.stringify({ typeId, values, phase, stepIndex, verified, acknowledged })); } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [storeKey, typeId, values, phase, stepIndex, verified, acknowledged]);

  const typeChoice = useMemo(() => config.typeChoices.find((t) => t.id === typeId) || null, [config, typeId]);
  const steps = useMemo(() => (typeId ? config.getSteps(typeId, values) : []), [config, typeId, values]);
  const currentStep = steps[stepIndex];
  const results = useMemo(() => (typeId ? config.compute(typeId, values) : null), [config, typeId, values]);
  const issues = useMemo(() => (typeId ? runVerification({ config, typeId, values, results }) : []), [config, typeId, values, results]);
  const confidence = useMemo(() => (typeId ? computeConfidence({ config, typeId, values, verified, results, issues }) : null), [config, typeId, values, verified, results, issues]);
  const statusId = useMemo(() => (typeId ? sectionStatus({ values, config, typeId, verified, results, issues }) : "not_started"), [values, config, typeId, verified, results, issues]);

  const setField = (field, val) => setValues((p) => ({ ...p, [field]: val }));

  const chooseType = (id) => {
    setTypeId(id);
    setValues({});
    setStepIndex(0);
    setPhase("measure");
    setVerified(false);
    setAcknowledged({});
    setChecklist({});
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

  // "Return to this later" — keeps the draft so it can be resumed.
  const returnLater = () => {
    if (onExit) onExit();
    else navigate("/");
  };

  const totalSteps = steps.length + 1;
  const stepNumber = phase === "review" ? totalSteps : stepIndex + 1;

  // Map a diagram dimension key to its step index (for tap-to-open).
  const dimToStepIndex = (key) => {
    const alias = { run: "treadDepth", rise: "riserHeight", landing: "landingDepth" };
    const target = alias[key] || key;
    const idx = steps.findIndex((s) => s.highlight === target || s.field === target);
    return idx >= 0 ? idx : null;
  };
  const onTapDimension = (key) => {
    const idx = dimToStepIndex(key);
    if (idx == null) return;
    setPhase("measure");
    setStepIndex(idx);
  };

  // Build fieldStatus map for diagram coloring.
  const fieldStatus = useMemo(() => {
    const map = {};
    steps.forEach((s) => {
      const k = s.highlight || s.field;
      if (!k) return;
      const val = values[s.field];
      const present = val != null && val !== "" && !(typeof val === "number" && val === 0 && !s.allowZero);
      map[k] = !present ? "missing" : verified ? "verified" : "needs_verification";
    });
    if (typeId && config.id === "steps") { map.run = "calculated"; map.rise = "calculated"; }
    return map;
  }, [steps, values, verified, typeId, config.id]);

  // ---------- TYPE CHOICE SCREEN (Visual Example Library) ----------
  if (phase === "type") {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <Header Icon={Icon} title={config.title} subtitle={config.subtitle} onBack={returnLater} right={null} />
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h2 className="text-base font-bold text-slate-700 mb-1">What are you measuring?</h2>
          <p className="text-sm text-slate-500 mb-4">Pick the closest visual example. Each shows the measurements you'll need.</p>
          <VisualExampleSelector choices={config.typeChoices} onSelect={chooseType} />
        </div>
      </div>
    );
  }

  // ---------- INPUT RENDERERS ----------
  const renderInput = (step) => {
    if (step.inputType === "length") {
      return <MeasurementInput label={step.question} value={values[step.field]} onChange={(v) => setField(step.field, v)} hint={step.unit === "sq ft" ? "Enter square feet as decimal" : undefined} />;
    }
    if (step.inputType === "integer") {
      return <Keypad question={step.question} value={values[step.field]} placeholder={step.placeholder} onChange={(v) => setField(step.field, v)} />;
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
            <button onClick={returnLater} className="flex items-center gap-1 bg-emerald-900/40 rounded-lg px-2.5 py-2 text-xs font-bold" aria-label="Return later">
              <Clock size={16} /> <span className="hidden sm:inline">Later</span>
            </button>
          </div>
        }
      />

      {/* Field Mode progress indicator */}
      <ProgressBar statusId={statusId} stepNumber={stepNumber} totalSteps={totalSteps} phase={phase} />

      <div className="max-w-2xl mx-auto px-4 py-4">
        {phase === "review" ? (
          <ReviewPanel
            config={config}
            typeId={typeChoice?.label}
            values={values}
            results={results}
            verified={verified}
            confidence={confidence}
            issues={issues.filter((i) => !acknowledged[i.id])}
            acknowledged={acknowledged}
            checklistQuestions={buildChecklist(config.id, typeChoice?.id)}
            checklist={checklist}
            onToggleCheck={(i) => setChecklist((p) => ({ ...p, [i]: !p[i] }))}
            onToggleVerified={() => setVerified((v) => !v)}
            onAcknowledge={(id) => setAcknowledged((p) => ({ ...p, [id]: !p[id] }))}
            onFix={(field) => onTapDimension(field)}
            onEdit={() => { setPhase("measure"); setStepIndex(0); }}
            onDuplicate={() => { setValues({}); setStepIndex(0); setPhase("measure"); setVerified(false); setAcknowledged({}); setChecklist({}); }}
            onAddAnother={() => { setTypeId(null); setValues({}); setPhase("type"); setVerified(false); setAcknowledged({}); setChecklist({}); }}
          />
        ) : (
          <div className="space-y-4">
            {/* Visual example + live preview (interactive: tap a dimension to open its input) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3">
              <GuidedDiagram
                diagram={currentStep?.diagram || typeChoice?.diagram}
                values={values}
                highlight={currentStep?.highlight}
                onTapDimension={onTapDimension}
                fieldStatus={fieldStatus}
              />
              <p className="text-[11px] text-slate-400 mt-2 text-center">Tap any dimension line to edit that measurement.</p>
            </div>

            {showHelp && currentStep?.help && <HelpCard help={currentStep.help} />}

            {/* One question at a time — extra-large, high-contrast */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xl font-bold text-slate-800 leading-snug">{currentStep?.question}</h3>
                {currentStep?.help && (
                  <button onClick={() => setShowHelp((s) => !s)} className="shrink-0 flex items-center gap-1 text-amber-700 text-sm font-semibold bg-amber-50 border border-amber-300 rounded-lg px-3 py-2">
                    <HelpCircle size={16} /> {showHelp ? "Hide" : "Not sure?"}
                  </button>
                )}
              </div>
              {renderInput(currentStep)}
              <p className="text-xs text-slate-400">Field Measured — stored at full precision. Visual edits never change this value.</p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Previous / Continue (fixed at bottom, one-handed reach) */}
      {phase === "measure" && (
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-3">
          <div className="max-w-2xl mx-auto flex gap-3">
            <button onClick={prev} className="flex items-center gap-1 px-5 py-4 rounded-xl border border-slate-300 text-slate-700 font-bold active:scale-95">
              <ChevronLeft size={20} /> Prev
            </button>
            {stepIndex < steps.length - 1 ? (
              <button onClick={next} className="flex-1 flex items-center justify-center gap-1 bg-emerald-700 text-white rounded-xl py-4 font-bold text-lg active:scale-95">
                Continue <ChevronRight size={22} />
              </button>
            ) : (
              <button onClick={() => setPhase("review")} className="flex-1 flex items-center justify-center gap-1 bg-emerald-700 text-white rounded-xl py-4 font-bold text-lg active:scale-95">
                <Check size={22} /> Mark Complete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Context-specific field verification checklist questions.
function buildChecklist(configId, typeId) {
  if (configId === "steps") {
    return [
      "Did you verify the total width across the front of the steps?",
      "Did you measure each tread depth (nose to riser, not the overhang)?",
      "Did you confirm the riser height of one step?",
      "Did you count only treads you step on (not the landing)?",
      typeId === "different" ? "Did you measure every step individually?" : "Did you confirm all steps are the same size?",
      "Did you include any landing length and width?",
      "Did you note the bullnose edge type?",
      "Did you take a supporting photo of the staircase?",
    ];
  }
  return [
    "Did you measure each segment's length end to end?",
    "Did you measure visible height only (exclude the buried course)?",
    "Did you count exposed ends separately from shared corners?",
    "Did you subtract any gate/window openings as area, not length?",
    "Did you confirm the block depth for end-area calculations?",
    "Did you identify inside vs. outside corners?",
    "Did you take a supporting photo of the wall?",
  ];
}

function Header({ Icon, title, subtitle, onBack, right }) {
  return (
    <div className="sticky top-0 z-20 bg-emerald-800 text-white px-4 py-3 flex items-center gap-3 shadow-md">
      <button onClick={onBack} className="p-2 -ml-2 rounded-lg hover:bg-emerald-700 transition" aria-label="Back">
        <ChevronLeft size={24} />
      </button>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {Icon && <Icon size={22} className="shrink-0" />}
        <div className="min-w-0">
          <h1 className="text-lg font-bold leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-emerald-100 leading-tight truncate">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

// Field Mode progress indicator: Not Started → Measuring → Needs Verification → Field Verified → Ready for Estimate.
function ProgressBar({ statusId, stepNumber, totalSteps, phase }) {
  const order = ["not_started", "measuring", "needs_verification", "field_verified", "ready_for_estimate"];
  const activeIdx = order.indexOf(statusId);
  return (
    <div className="bg-white border-b border-slate-200 px-3 py-2">
      <div className="max-w-2xl mx-auto flex items-center gap-1">
        {STATUS_ORDER.map((s, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx;
          const color =
            s.id === "not_started" ? "bg-slate-300" :
            s.id === "measuring" ? "bg-blue-500" :
            s.id === "needs_verification" ? "bg-amber-500" :
            "bg-emerald-500";
          return (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-0.5 min-w-0">
                <div className={`h-2.5 w-2.5 rounded-full ${done || active ? color : "bg-slate-200"} ${active ? "ring-2 ring-offset-1 ring-slate-400" : ""}`} />
                <span className={`text-[9px] leading-tight text-center ${active ? "font-bold text-slate-700" : "text-slate-400"}`}>{s.label}</span>
              </div>
              {i < STATUS_ORDER.length - 1 && <div className={`h-0.5 flex-1 ${i < activeIdx ? color : "bg-slate-200"}`} />}
            </React.Fragment>
          );
        })}
      </div>
      {phase === "measure" && (
        <div className="max-w-2xl mx-auto mt-1 text-[10px] text-slate-400 text-center">
          Question {stepNumber} of {totalSteps - 1} · Field Mode
        </div>
      )}
    </div>
  );
}

// Large outdoor-readable numeric keypad for integer inputs.
function Keypad({ question, value, placeholder, onChange }) {
  const press = (d) => {
    const cur = value == null ? "" : String(value);
    if (d === "del") return onChange(cur.length ? Number(cur.slice(0, -1)) : null);
    let next = cur === "0" ? d : cur + d;
    if (next === "") next = "";
    onChange(next === "" ? null : Number(next));
  };
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];
  return (
    <div>
      <Label className="text-base font-semibold">{question}</Label>
      <div className="mt-1 mb-3 h-14 rounded-xl border-2 border-slate-300 bg-slate-50 flex items-center justify-center text-3xl font-bold text-slate-800">
        {value == null || value === "" ? <span className="text-slate-300 text-base font-normal">{placeholder || "0"}</span> : value}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {keys.map((k, i) =>
          k === "" ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              onClick={() => press(k)}
              className="h-16 rounded-xl bg-slate-100 border border-slate-200 text-2xl font-bold text-slate-800 active:bg-slate-200 active:scale-95 flex items-center justify-center"
            >
              {k === "del" ? <Delete size={24} /> : k}
            </button>
          )
        )}
      </div>
    </div>
  );
}
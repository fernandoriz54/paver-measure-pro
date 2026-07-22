// Measurement Verification Engine — transparent, rule-based checks (no AI).
// Returns issues: { id, severity: 'error'|'warning'|'info', field, message, why, howToVerify, fixable }

export function runVerification({ config, typeId, values, results }) {
  const v = values || {};
  const issues = [];
  const expected = config.expectedFields ? config.expectedFields(typeId, v) : [];

  for (const f of expected) {
    const val = v[f.key];
    const isMissing = val == null || val === "";
    const isZero = typeof val === "number" && val === 0;
    if (f.optional) {
      // optional fields only warn if an inconsistent value was entered
      continue;
    }
    if (isMissing) {
      issues.push({
        id: `missing_${f.key}`, severity: "error", field: f.key, fixable: true,
        message: `${f.label} is missing.`,
        why: f.why || "A missing dimension prevents an accurate calculation.",
        howToVerify: `Measure ${f.label.toLowerCase()} on site and enter the value.`,
      });
    } else if (isZero && !f.allowZero) {
      issues.push({
        id: `zero_${f.key}`, severity: "warning", field: f.key, fixable: true,
        message: `${f.label} is 0.`,
        why: "A zero dimension may mean this feature isn't present, or was skipped by mistake.",
        howToVerify: "Confirm whether this feature exists. Enter 0 only if it is intentionally absent.",
      });
    }
  }

  if (config.verify) issues.push(...config.verify(typeId, v, results));

  // de-dup by id, keep first
  const seen = new Set();
  return issues.filter((it) => (seen.has(it.id) ? false : (seen.add(it.id), true)));
}

// Confidence score — transparent rules, 4 levels.
export function computeConfidence({ config, typeId, values, verified, results, issues }) {
  const expected = config.expectedFields ? config.expectedFields(typeId, values || {}) : [];
  const required = expected.filter((f) => !f.optional);
  const v = values || {};
  const missing = required.filter((f) => {
    const val = v[f.key];
    return val == null || val === "" || (typeof val === "number" && val === 0 && !f.allowZero);
  });
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  if (missing.length > 0)
    return { level: "incomplete", label: "Incomplete", color: "red", detail: `Missing ${missing.length} required measurement(s).`, items: missing };
  if (errors.length > 0)
    return { level: "review", label: "Review", color: "red", detail: `${errors.length} error(s) to resolve.`, items: errors };
  if (!verified && warnings.length > 0)
    return { level: "verify", label: "Needs Verification", color: "amber", detail: `${warnings.length} check(s) to verify on site.`, items: warnings };
  if (!verified)
    return { level: "good", label: "Good", color: "amber", detail: "Usable — verify on site to lock in.", items: warnings };
  return { level: "verified", label: "Field Verified", color: "green", detail: "All critical measurements verified.", items: [] };
}

// Section progress status — 5 states shown in the Field Mode progress bar.
export function sectionStatus({ values, config, typeId, verified, results, issues }) {
  const expected = config.expectedFields ? config.expectedFields(typeId, values || {}) : [];
  const required = expected.filter((f) => !f.optional);
  const v = values || {};
  const anyValue = Object.values(v).some((x) => x != null && x !== "" && !(typeof x === "number" && x === 0));
  if (!anyValue) return "not_started";
  const missing = required.filter((f) => {
    const val = v[f.key];
    return val == null || val === "" || (typeof val === "number" && val === 0 && !f.allowZero);
  });
  if (missing.length > 0) return "measuring";
  if (!verified) return "needs_verification";
  const blocking = (issues || []).filter((i) => i.severity === "error");
  if (blocking.length > 0) return "needs_verification";
  return "ready_for_estimate";
}

export const STATUS_ORDER = [
  { id: "not_started", label: "Not Started", color: "slate" },
  { id: "measuring", label: "Measuring", color: "blue" },
  { id: "needs_verification", label: "Needs Verification", color: "amber" },
  { id: "field_verified", label: "Field Verified", color: "emerald" },
  { id: "ready_for_estimate", label: "Ready for Estimate", color: "emerald" },
];
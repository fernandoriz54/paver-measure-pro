// Helpers for saving/restoring the full Estimate Builder document.
// The Project entity stores the whole editable state in `builder_state` so a
// saved project reopens exactly as it was — raw measurements, deductions,
// visualizer layout, waste, totals, notes and all.

export const BUILDER_VERSION = 1;

// Compose the snapshot object stored on Project.builder_state.
export function buildSnapshot({
  clientName,
  projectName,
  sections,
  deductions,
  visualizer,
  waste,
  notes,
  totals,
}) {
  return {
    version: BUILDER_VERSION,
    projectName: projectName || clientName || "",
    clientName: clientName || "",
    sections: (sections || []).map((s) => ({
      id: s.id,
      label: s.label,
      name: s.name || "",
      shape: s.shape,
      measurements: { ...(s.measurements || {}) },
      rotation: s.rotation || 0,
      notes: s.notes || "",
    })),
    deductions: (deductions || []).map((d) => ({ ...d, params: { ...(d.params || {}) } })),
    visualizer: visualizer || {},
    wastePercent: waste ?? 0,
    notes: notes || "",
    grossArea: totals?.grossArea ?? 0,
    deductionArea: totals?.deductionArea ?? 0,
    netArea: totals?.netArea ?? 0,
    perimeter: totals?.perimeter ?? 0,
    finalTotal: totals?.finalTotal ?? 0,
    updatedAt: new Date().toISOString(),
  };
}

// Turn a saved builder_state back into the live Builder state shape.
export function hydrate(state) {
  if (!state || typeof state !== "object") return null;
  return {
    clientName: state.clientName || state.projectName || "",
    projectName: state.projectName || state.clientName || "",
    sections: Array.isArray(state.sections) ? state.sections.map((s) => ({
      id: s.id,
      label: s.label,
      name: s.name || "",
      shape: s.shape || "rectangle",
      measurements: s.measurements || {},
      rotation: s.rotation || 0,
      notes: s.notes || "",
    })) : [],
    deductions: Array.isArray(state.deductions) ? state.deductions.map((d) => ({ ...d, params: { ...(d.params || {}) } })) : [],
    visualizer: state.visualizer || {},
    waste: state.wastePercent ?? 0,
    notes: state.notes || "",
  };
}

const RECOVERY_PREFIX = "paverMeasurePro_builder_recovery_";
export const recoveryKey = (projectId) => `${RECOVERY_PREFIX}${projectId || "unsaved"}`;
export const saveRecovery = (projectId, snapshot) => {
  try {
    localStorage.setItem(recoveryKey(projectId), JSON.stringify({ snapshot, ts: Date.now() }));
  } catch {}
};
export const loadRecovery = (projectId) => {
  try {
    const raw = localStorage.getItem(recoveryKey(projectId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
export const clearRecovery = (projectId) => {
  try { localStorage.removeItem(recoveryKey(projectId)); } catch {}
};
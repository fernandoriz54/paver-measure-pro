import React, { useState } from "react";
import { AlertTriangle, AlertOctagon, Info, Wrench, Pencil } from "lucide-react";

// Rich warning/issue list: why it matters, how to verify, Fix Now, Mark Intentionally Different.
export default function WarningPanel({ issues, onFix, onAcknowledge, acknowledged }) {
  const [openId, setOpenId] = useState(null);
  if (!issues || issues.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-2">
        <Info size={18} className="text-emerald-600" />
        <span className="text-sm font-medium text-emerald-700">No verification issues found.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {issues.map((it) => {
        const isErr = it.severity === "error";
        const Icon = isErr ? AlertOctagon : AlertTriangle;
        const acc = isErr ? "border-rose-300 bg-rose-50" : "border-amber-300 bg-amber-50";
        const txt = isErr ? "text-rose-700" : "text-amber-700";
        const acked = acknowledged?.[it.id];
        const open = openId === it.id;
        return (
          <div key={it.id} className={`rounded-2xl border ${acc} p-3`}>
            <button onClick={() => setOpenId(open ? null : it.id)} className="w-full flex items-start gap-2 text-left">
              <Icon size={18} className={`${txt} shrink-0 mt-0.5`} />
              <div className="flex-1">
                <div className={`text-sm font-semibold ${txt}`}>{it.message}</div>
                {acked && <span className="text-[11px] font-bold text-slate-500">Marked intentionally different</span>}
              </div>
            </button>
            {open && (
              <div className="mt-2 pl-7 space-y-2">
                {it.why && <p className="text-xs text-slate-600"><b>Why it matters:</b> {it.why}</p>}
                {it.howToVerify && <p className="text-xs text-slate-600"><b>How to verify:</b> {it.howToVerify}</p>}
                <div className="flex gap-2 pt-1">
                  {it.fixable && onFix && (
                    <button onClick={() => onFix(it.field)} className="flex items-center gap-1 text-xs font-bold bg-slate-800 text-white rounded-lg px-2.5 py-1.5">
                      <Wrench size={13} /> Fix Now
                    </button>
                  )}
                  {onAcknowledge && (
                    <button onClick={() => onAcknowledge(it.id)} className={`flex items-center gap-1 text-xs font-bold rounded-lg px-2.5 py-1.5 border ${acked ? "border-slate-300 bg-white text-slate-400" : "border-slate-400 bg-white text-slate-600"}`}>
                      <Pencil size={13} /> {acked ? "Acknowledged" : "Mark as Intentionally Different"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
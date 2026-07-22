import React from "react";
import { ShieldCheck, ShieldAlert, ShieldQuestion, ShieldX } from "lucide-react";

const MAP = {
  incomplete: { Icon: ShieldX, ring: "border-rose-300 bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  review: { Icon: ShieldX, ring: "border-rose-300 bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  verify: { Icon: ShieldAlert, ring: "border-amber-300 bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  good: { Icon: ShieldQuestion, ring: "border-amber-200 bg-amber-50 text-amber-700", dot: "bg-amber-400" },
  verified: { Icon: ShieldCheck, ring: "border-emerald-400 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
};

export default function ConfidenceBadge({ confidence, compact }) {
  if (!confidence) return null;
  const m = MAP[confidence.level] || MAP.incomplete;
  const { Icon } = m;
  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${m.ring}`}>
        <Icon size={14} /> {confidence.label}
      </span>
    );
  }
  return (
    <div className={`rounded-2xl border-2 p-4 ${m.ring}`}>
      <div className="flex items-center gap-2">
        <Icon size={22} />
        <div>
          <div className="text-sm font-bold">Confidence: {confidence.label}</div>
          <div className="text-xs opacity-90">{confidence.detail}</div>
        </div>
      </div>
      {confidence.items?.length > 0 && (
        <ul className="mt-2 space-y-1">
          {confidence.items.slice(0, 6).map((it, i) => (
            <li key={i} className="text-xs flex gap-1.5">
              <span className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${m.dot}`} />
              <span>{it.label || it.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
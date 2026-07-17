import React, { useRef } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { curveGeometry, ensureCurve, handleYToAmount } from "@/lib/curvePath";

// Renders a path-kind obstacle as a true curved band (centerline + filled band
// via stroked path) with draggable curve handles. Visual only — never changes
// the measured centerline length or width.
export default function CurvedPath({
  item,
  color,
  scale,
  pos,
  onSelect,
  selected,
  onUpdateCurve,
  onDragEnd,
  editable,
}) {
  const L = Math.max(2, item.params?.linear || 0);
  const W = Math.max(0.5, item.params?.width || 0);
  const c = ensureCurve(item.curve);
  const geo = curveGeometry(item.curve, L, W);

  const pxW = geo.heightFt * scale;
  const pxL = L * scale;
  const divRef = useRef(null);

  const locked = c.locked || c.lockPosition;

  const handlePointer = (e, handleId) => {
    if (locked || !editable) return;
    e.stopPropagation();
    onSelect();
    const startClientY = e.clientY;
    const startHandleY = geo.handles.find((h) => h.id === handleId).y;
    const move = (ev) => {
      const dyPx = ev.clientY - startClientY;
      const dyFt = dyPx / scale;
      const newHandleY = startHandleY + dyFt;
      let amount = handleYToAmount(newHandleY, geo.midY, L);
      if (c.style === "scurve" || c.style === "freeform") amount = amount * 2; // two bends feel stronger
      onUpdateCurve({ amount: Math.max(-100, Math.min(100, amount)) });
    };
    const up = () => window.removeEventListener("pointermove", move);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  };

  const fill = color + "33";
  const stroke = color;

  return (
    <motion.div
      ref={divRef}
      drag={!locked && editable}
      dragMomentum={false}
      animate={{ x: pos.x, y: pos.y, rotate: c.rotation || 0 }}
      onPointerDown={() => editable && onSelect()}
      onDragEnd={(_, info) => onDragEnd(pos.x + info.offset.x, pos.y + info.offset.y)}
      className="absolute select-none"
      style={{
        width: pxL,
        height: pxW,
        transformOrigin: "center center",
        cursor: locked ? "default" : "grab",
      }}
    >
      <svg width={pxL} height={pxW} viewBox={`0 0 ${L} ${geo.heightFt}`} className="overflow-visible">
        {/* filled band = stroked centerline with round caps */}
        <path d={geo.centerD} fill="none" stroke={fill} strokeWidth={geo.bandWidth} strokeLinecap="round" />
        <path d={geo.centerD} fill="none" stroke={stroke} strokeWidth={geo.bandWidth + 0.3} strokeLinecap="round" opacity={0.15} />
        {/* edges + centerline */}
        <path d={geo.centerD} fill="none" stroke={stroke} strokeWidth={0.25} strokeDasharray="0.8 0.8" />
        {/* start / end caps markers */}
        <circle cx={geo.start.x} cy={geo.start.y} r={0.4} fill={stroke} />
        <circle cx={geo.end.x} cy={geo.end.y} r={0.4} fill={stroke} />
      </svg>

      {/* label */}
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-5 whitespace-nowrap text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/90 border border-slate-200 shadow-sm" style={{ color: stroke }}>
        {item.label || item.name}
      </div>

      {/* handles when selected */}
      {selected && editable && (
        <>
          {geo.handles.map((h) => (
            <div
              key={h.id}
              onPointerDown={(e) => handlePointer(e, h.id)}
              className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-white border-2 shadow cursor-ns-resize"
              style={{ left: h.x * scale, top: h.y * scale, borderColor: stroke, touchAction: "none" }}
              title="Drag to bend"
            />
          ))}
          {/* start / end drag targets (move whole path) */}
          <div
            onPointerDown={(e) => { if (locked) return; e.stopPropagation(); onSelect(); }}
            className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-white border border-slate-300"
            style={{ left: geo.start.x * scale, top: geo.start.y * scale }}
            title="Start"
          />
          <div
            onPointerDown={(e) => { if (locked) return; e.stopPropagation(); onSelect(); }}
            className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-white border border-slate-300"
            style={{ left: geo.end.x * scale, top: geo.end.y * scale }}
            title="End"
          />
        </>
      )}

      {locked && (
        <div className="absolute -top-3 -right-3"><Lock size={12} className="text-slate-500 bg-white rounded-full p-0.5 border border-slate-200" /></div>
      )}
    </motion.div>
  );
}
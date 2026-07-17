import React, { createContext, useContext, useRef, useCallback, useEffect, useState } from "react";

const ConverterContext = createContext(null);

export function useConverter() {
  return useContext(ConverterContext);
}

// Tracks the last-focused input/textarea so the converter can insert a value
// into the active measurement field without any per-field wiring.
export function ConverterProvider({ children }) {
  const activeElRef = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) {
        activeElRef.current = t;
      }
    };
    document.addEventListener("focusin", handler, true);
    return () => document.removeEventListener("focusin", handler, true);
  }, []);

  const insert = useCallback((value) => {
    const el = activeElRef.current;
    if (!el) {
      setOpen(true);
      return false;
    }
    const proto = el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
    setter.call(el, String(value));
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.focus();
    return true;
  }, []);

  return (
    <ConverterContext.Provider value={{ open, setOpen, insert }}>
      {children}
    </ConverterContext.Provider>
  );
}
"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: CheckCircle2, cls: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" },
  error: { icon: AlertCircle, cls: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200" },
  info: { icon: Info, cls: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200" },
};

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const counter = useRef(0);

  const remove = useCallback((id) => setItems((list) => list.filter((i) => i.id !== id)), []);

  const push = useCallback(
    (type, message) => {
      counter.current += 1;
      const id = counter.current;
      setItems((list) => [...list.slice(-3), { id, type, message }]);
      setTimeout(() => remove(id), type === "error" ? 6000 : 3500);
    },
    [remove]
  );

  const api = useMemo(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="no-print pointer-events-none fixed inset-x-3 bottom-3 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4">
        {items.map((item) => {
          const { icon: Icon, cls } = STYLES[item.type];
          return (
            <div
              key={item.id}
              role="status"
              className={`animate-pop-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg sm:w-auto ${cls}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <span className="min-w-0 flex-1 break-words">{item.message}</span>
              <button onClick={() => remove(item.id)} className="shrink-0 opacity-60 hover:opacity-100" aria-label="close">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast ToastProvider ichida ishlatilishi kerak");
  return ctx;
}

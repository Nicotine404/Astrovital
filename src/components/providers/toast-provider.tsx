"use client";

import * as React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Toast = { id: number; message: string; tone: "default" | "error" };
const ToastContext = React.createContext<(message: string, tone?: Toast["tone"]) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const push = React.useCallback((message: string, tone: Toast["tone"] = "default") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex max-w-sm items-center gap-2.5 rounded-lg border bg-popover px-3.5 py-2.5 text-[13px] shadow-xl animate-in fade-in-0 slide-in-from-bottom-2",
              t.tone === "error" && "border-critical/40"
            )}
          >
            {t.tone === "error" ? <XCircle className="size-4 text-critical" /> : <CheckCircle2 className="size-4 text-nominal" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => React.useContext(ToastContext);

"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { combineClassNames } from "@/lib/utils";
import { CheckIcon, AlertIcon } from "@/components/ui/icons";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
};

type ToastContextValue = {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [exitingIds, setExitingIds] = useState<Record<string, boolean>>({});
  const timersRef = useRef<Record<string, number>>({});

  const removeToast = useCallback((toastId: string) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId));
    setExitingIds((current) => {
      const next = { ...current };
      delete next[toastId];
      return next;
    });
  }, []);

  const dismissToast = useCallback((toastId: string) => {
    if (exitingIds[toastId]) return;
    setExitingIds((current) => ({ ...current, [toastId]: true }));
    window.setTimeout(() => removeToast(toastId), 220);
  }, [exitingIds, removeToast]);

  const addToast = useCallback(
    (message: string, variant: ToastVariant, duration = 3800) => {
      const toastId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((currentToasts) => [...currentToasts, { id: toastId, message, variant, duration }]);

      timersRef.current[toastId] = window.setTimeout(() => {
        delete timersRef.current[toastId];
        dismissToast(toastId);
      }, duration);
    },
    [dismissToast]
  );

  const showSuccess = useCallback((message: string) => addToast(message, "success"), [addToast]);
  const showError = useCallback((message: string) => addToast(message, "error"), [addToast]);
  const showInfo = useCallback((message: string) => addToast(message, "info"), [addToast]);

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showInfo }}>
      {children}

      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full sm:w-auto"
      >
        {toasts.map((toast) => {
          const duration = toast.duration ?? 3800;
          return (
            <div
              key={toast.id}
              role="status"
              onClick={() => dismissToast(toast.id)}
              className={combineClassNames(
                "pointer-events-auto relative overflow-hidden rounded-xl border bg-surface/95 px-4.5 py-3.5 shadow-xl backdrop-blur-md transition-all duration-200 cursor-pointer group",
                exitingIds[toast.id]
                  ? "animate-slide-out-right opacity-0 scale-95"
                  : "animate-slide-in-right scale-100",
                toast.variant === "success"
                  ? "border-emerald-500/30 bg-emerald-50/90 text-emerald-950 dark:bg-emerald-950/80 dark:text-emerald-100 dark:border-emerald-500/40"
                  : toast.variant === "error"
                  ? "border-rose-500/30 bg-rose-50/90 text-rose-950 dark:bg-rose-950/80 dark:text-rose-100 dark:border-rose-500/40"
                  : "border-blue-500/30 bg-blue-50/90 text-blue-950 dark:bg-blue-950/80 dark:text-blue-100 dark:border-blue-500/40"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={combineClassNames(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white shadow-sm animate-pop",
                    toast.variant === "success"
                      ? "bg-emerald-600"
                      : toast.variant === "error"
                      ? "bg-rose-600"
                      : "bg-blue-600"
                  )}
                >
                  {toast.variant === "success" ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : toast.variant === "error" ? (
                    <AlertIcon className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-bold">i</span>
                  )}
                </span>
                <p className="text-sm font-semibold leading-snug tracking-tight flex-1">
                  {toast.message}
                </p>
                <span className="text-xs opacity-50 group-hover:opacity-100 transition-opacity">
                  ✕
                </span>
              </div>

              {/* Progress timer bar animation */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/10">
                <div
                  className={combineClassNames(
                    "h-full transition-all ease-linear",
                    toast.variant === "success"
                      ? "bg-emerald-500"
                      : toast.variant === "error"
                      ? "bg-rose-500"
                      : "bg-blue-500"
                  )}
                  style={{
                    animation: `toast-progress ${duration}ms linear forwards`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const contextValue = useContext(ToastContext);
  if (!contextValue) {
    throw new Error("useToast harus digunakan di dalam ToastProvider");
  }
  return contextValue;
}

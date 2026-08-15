"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { combineClassNames } from "@/lib/utils";
import { CheckIcon, AlertIcon } from "@/components/ui/icons";

type ToastVariant = "success" | "error";

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((toastId: string) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== toastId));
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant) => {
      const toastId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((currentToasts) => [...currentToasts, { id: toastId, message, variant }]);
      window.setTimeout(() => removeToast(toastId), 4000);
    },
    [removeToast]
  );

  const showSuccess = useCallback((message: string) => addToast(message, "success"), [addToast]);
  const showError = useCallback((message: string) => addToast(message, "error"), [addToast]);

  return (
    <ToastContext.Provider value={{ showSuccess, showError }}>
      {children}

      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={combineClassNames(
              "pointer-events-auto flex items-center gap-2.5 rounded-md border bg-surface px-4 py-3 text-sm font-medium shadow-modal",
              toast.variant === "success" ? "border-success/30 text-success" : "border-danger/30 text-danger"
            )}
          >
            {toast.variant === "success" ? <CheckIcon className="h-4 w-4" /> : <AlertIcon className="h-4 w-4" />}
            {toast.message}
          </div>
        ))}
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

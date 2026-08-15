"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CloseIcon } from "@/components/ui/icons";
import { combineClassNames } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: "small" | "medium" | "large";
};

const maxWidthClasses = {
  small: "max-w-md",
  medium: "max-w-lg",
  large: "max-w-2xl",
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, description, children, maxWidth = "medium" }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    window.setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 180);
  }, [onClose]);

  const getFocusableElements = useCallback(() => {
    if (!dialogRef.current) return [];
    return Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === firstElement || !dialogRef.current?.contains(activeElement))) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    },
    [getFocusableElements, handleClose]
  );

  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    const initialFocusableElement = getFocusableElements()[0];
    initialFocusableElement?.focus();

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [open, handleKeyDown, getFocusableElements]);

  if (!open) return null;

  return (
    <div
      className={combineClassNames(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4",
        isClosing ? "animate-fade-out" : "animate-fade-in"
      )}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={combineClassNames(
          "flex max-h-[90vh] w-full flex-col rounded-2xl border border-border/80 bg-surface shadow-2xl overflow-hidden",
          isClosing ? "animate-scale-out" : "animate-scale-in",
          maxWidthClasses[maxWidth]
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border/60 px-6 pt-5 pb-4">
          <div className="flex flex-col gap-1">
            <h2 id="modal-title" className="text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            {description ? <p className="text-sm text-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Tutup dialog"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-zinc-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
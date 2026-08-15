import type { ReactNode } from "react";
import { combineClassNames } from "@/lib/utils";

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "primary" | "outline";

type BadgeProps = {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
};

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-zinc-100 text-zinc-700",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  primary: "bg-primary-soft text-primary",
  outline: "bg-surface border border-border text-foreground",
};

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  return (
    <span
      className={combineClassNames(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
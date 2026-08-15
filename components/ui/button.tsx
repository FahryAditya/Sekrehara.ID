 import type { ButtonHTMLAttributes, ReactNode } from "react";
import { combineClassNames } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "danger-outline";
type ButtonSize = "small" | "medium" | "large";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary/40 shadow-xs",
  secondary:
    "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 focus-visible:ring-zinc-300",
  ghost: "text-foreground hover:bg-zinc-100 focus-visible:ring-zinc-300",
  danger: "bg-danger text-white hover:bg-red-700 focus-visible:ring-danger/40 shadow-xs",
  "danger-outline":
    "bg-surface text-danger border border-danger/40 hover:bg-danger-soft focus-visible:ring-danger/30",
};

const sizeClasses: Record<ButtonSize, string> = {
  small: "h-8 px-3 text-sm gap-1.5",
  medium: "h-10 px-4 text-sm gap-2",
  large: "h-11 px-5 text-base gap-2",
};

export function Button({
  variant = "primary",
  size = "medium",
  isLoading = false,
  disabled,
  className,
  children,
  ...restProps
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type="button"
      className={combineClassNames(
        "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
        "active:scale-[0.98]",
        "disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={isDisabled}
      {...restProps}
    >
      {isLoading ? <Spinner size="small" /> : null}
      {children}
    </button>
  );
}

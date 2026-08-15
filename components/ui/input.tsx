import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { combineClassNames } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label?: string;
  error?: string;
  helpText?: string;
  prefixIcon?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, error, helpText, prefixIcon, className, disabled, ...restProps },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
      ) : null}

      <div className="relative">
        {prefixIcon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {prefixIcon}
          </span>
        ) : null}

        <input
          ref={ref}
          id={id}
          className={combineClassNames(
            "h-10 w-full rounded-md border bg-surface px-3 text-sm text-foreground placeholder:text-muted",
            "transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1",
            prefixIcon ? "pl-10" : "",
            error
              ? "border-danger focus:ring-danger/40"
              : "border-border focus:border-primary focus:ring-primary/30",
            disabled ? "cursor-not-allowed opacity-60" : "",
            className
          )}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
          {...restProps}
        />
      </div>

      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      {helpText && !error ? (
        <p id={`${id}-help`} className="text-xs text-muted">
          {helpText}
        </p>
      ) : null}
    </div>
  );
});
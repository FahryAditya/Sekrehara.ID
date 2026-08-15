import type { TextareaHTMLAttributes } from "react";
import { combineClassNames } from "@/lib/utils";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  label?: string;
  error?: string;
};

export function Textarea({ id, label, error, className, disabled, ...restProps }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
      ) : null}

      <textarea
        id={id}
        className={combineClassNames(
          "w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted",
          "transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1",
          error
            ? "border-danger focus:ring-danger/40"
            : "border-border focus:border-primary focus:ring-primary/30",
          disabled ? "cursor-not-allowed opacity-60" : "",
          className
        )}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        {...restProps}
      />

      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : null}
    </div>
  );
}

import type { SelectHTMLAttributes, ReactNode } from "react";
import { combineClassNames } from "@/lib/utils";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  id: string;
  label?: string;
  error?: string;
  children: ReactNode;
};

export function Select({ id, label, error, className, children, disabled, ...restProps }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
      ) : null}

      <select
        id={id}
        className={combineClassNames(
          "h-10 w-full rounded-md border bg-surface px-3 pr-9 text-sm text-foreground",
          "appearance-none bg-no-repeat bg-[right_0.75rem_center]",
          "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]",
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
      >
        {children}
      </select>

      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : null}
    </div>
  );
}

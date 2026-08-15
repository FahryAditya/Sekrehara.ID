import type { HTMLAttributes, ReactNode } from "react";
import { combineClassNames } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ className, children, ...restProps }: CardProps) {
  return (
    <div
      className={combineClassNames(
        "rounded-card border border-border bg-surface shadow-card",
        className
      )}
      {...restProps}
    >
      {children}
    </div>
  );
}

type CardHeaderProps = {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
};

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div
      className={combineClassNames(
        "flex items-start justify-between gap-4 border-b border-border px-6 py-4",
        className
      )}
    >
      <div className="flex flex-col gap-0.5">
        {title ? <h2 className="text-base font-semibold text-foreground">{title}</h2> : null}
        {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={combineClassNames("px-6 py-5", className)}>{children}</div>;
}
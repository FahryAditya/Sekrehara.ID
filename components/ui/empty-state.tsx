"use client";

import { combineClassNames } from "@/lib/utils";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={combineClassNames(
        "flex flex-col items-center justify-center gap-3 py-14 text-center",
        className
      )}
    >
      {icon ? (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background text-muted">
          {icon}
        </span>
      ) : null}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description ? <p className="max-w-sm text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { combineClassNames } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  icon: ReactNode;
  accentClassName?: string;
  footer?: ReactNode;
};

export function StatCard({ label, value, icon, accentClassName, footer }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span
          className={combineClassNames(
            "flex h-10 w-10 items-center justify-center rounded-md",
            accentClassName ?? "bg-primary-soft text-primary"
          )}
        >
          {icon}
        </span>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {footer ? <div className="text-xs text-muted">{footer}</div> : null}
    </Card>
  );
}

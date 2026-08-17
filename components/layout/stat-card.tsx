"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { combineClassNames } from "@/lib/utils";
import { useCountUp } from "@/lib/use-count-up";

type StatCardProps = {
  label: string;
  value: string;
  numericValue?: number;
  animateValue?: boolean;
  formatValue?: (value: number) => string;
  icon: ReactNode;
  accentClassName?: string;
  footer?: ReactNode;
};

export function StatCard({
  label,
  value,
  numericValue,
  animateValue = false,
  formatValue,
  icon,
  accentClassName,
  footer,
}: StatCardProps) {
  const { value: animatedValue, elementRef } = useCountUp(numericValue ?? 0);
  const displayValue =
    animateValue && numericValue !== undefined
      ? formatValue
        ? formatValue(Math.round(animatedValue))
        : Math.round(animatedValue).toString()
      : value;

  return (
    <Card className="flex flex-col gap-4 p-5 animate-fade-in-up">
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
      <span
        ref={elementRef}
        className="block text-2xl font-semibold tracking-tight text-foreground tabular-nums"
      >
        {displayValue}
      </span>
      {footer ? <div className="text-xs text-muted">{footer}</div> : null}
    </Card>
  );
}

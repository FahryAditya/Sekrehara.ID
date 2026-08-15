import { combineClassNames } from "@/lib/utils";

export function Spinner({ size = "medium", className }: { size?: "small" | "medium" | "large"; className?: string }) {
  const sizeClasses = {
    small: "h-4 w-4 border-2",
    medium: "h-6 w-6 border-2",
    large: "h-10 w-10 border-4",
  };

  return (
    <span
      role="status"
      aria-label="Memuat"
      className={combineClassNames(
        "inline-block animate-spin rounded-full border-current border-t-transparent",
        sizeClasses[size],
        className
      )}
    />
  );
}

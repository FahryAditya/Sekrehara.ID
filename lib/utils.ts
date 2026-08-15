type ClassValue = string | false | null | undefined;

export function combineClassNames(...classValues: ClassValue[]): string {
  return classValues.filter(Boolean).join(" ");
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

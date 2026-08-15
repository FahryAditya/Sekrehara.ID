const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("id-ID");

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatRupiah(amount: number): string {
  return rupiahFormatter.format(amount);
}

export function formatNumber(amount: number): string {
  return numberFormatter.format(amount);
}

export function formatDate(dateString: string): string {
  return dateFormatter.format(new Date(dateString));
}

export function formatDateTime(dateString: string): string {
  return dateTimeFormatter.format(new Date(dateString));
}

export function formatPercent(part: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

const RELATIVE_UNITS: Array<{ unit: Intl.RelativeTimeFormatUnit; seconds: number }> = [
  { unit: "year", seconds: 365 * 24 * 60 * 60 },
  { unit: "month", seconds: 30 * 24 * 60 * 60 },
  { unit: "week", seconds: 7 * 24 * 60 * 60 },
  { unit: "day", seconds: 24 * 60 * 60 },
  { unit: "hour", seconds: 60 * 60 },
  { unit: "minute", seconds: 60 },
];

const relativeFormatter = new Intl.RelativeTimeFormat("id-ID", { numeric: "auto" });

export function formatRelative(dateString: string): string {
  const date = new Date(dateString);
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);

  for (const { unit, seconds } of RELATIVE_UNITS) {
    if (Math.abs(diffSeconds) >= seconds || unit === "minute") {
      return relativeFormatter.format(Math.round(diffSeconds / seconds), unit);
    }
  }

  return relativeFormatter.format(0, "minute");
}

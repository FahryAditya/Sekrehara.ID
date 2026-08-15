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

export type Role = "ADMIN" | "SUPERADMIN";

export type AttendanceStatus = "HADIR" | "IZIN" | "ALPA";

export type TransactionType = "PEMASUKAN" | "PENGELUARAN";

export type Transaction = {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
};

export type AttendanceMap = Record<string, Record<string, AttendanceStatus>>;

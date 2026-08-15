export type Role = "ADMIN" | "SUPERADMIN";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  createdAt: string;
};

export type Participant = {
  id: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
};

export type ActivityEvent = {
  id: string;
  name: string;
  date: string;
  description: string;
  createdAt: string;
};

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

export type Announcement = {
  id: string;
  subject: string;
  body: string;
  recipientCount: number;
  sentAt: string;
};

export type AttendanceMap = Record<string, Record<string, AttendanceStatus>>;

export type AppData = {
  users: User[];
  participants: Participant[];
  events: ActivityEvent[];
  attendance: AttendanceMap;
  transactions: Transaction[];
  announcements: Announcement[];
};

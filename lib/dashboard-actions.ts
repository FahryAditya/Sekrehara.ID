"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";

export type DashboardAttendanceSummary = {
  hadir: number;
  izin: number;
  alpa: number;
  recorded: number;
};

export type DashboardLatestTransaction = {
  id: string;
  type: "PEMASUKAN" | "PENGELUARAN";
  category: string;
  amount: number;
  description: string;
  date: string;
};

export type DashboardLatestParticipant = {
  id: string;
  name: string;
  email: string | null;
  createdAt: string;
};

export type DashboardEventCard = {
  id: string;
  name: string;
  date: string;
} & DashboardAttendanceSummary;

export type DashboardStats = {
  currentUser: { id: string; name: string; role: string };
  memberCount: number;
  totalParticipantEmails: number;
  todayEvent: DashboardEventCard | null;
  latestEvent: DashboardEventCard | null;
  cashSummary: { pemasukan: number; pengeluaran: number; saldo: number };
  latestTransactions: DashboardLatestTransaction[];
  latestParticipants: DashboardLatestParticipant[];
  announcementsTotal: number;
  latestAnnouncements: {
    id: string;
    subject: string;
    body: string;
    sentAt: string;
  }[];
};

function summarizeAttendance(
  attendance: { status: string }[]
): DashboardAttendanceSummary {
  let hadir = 0;
  let izin = 0;
  let alpa = 0;
  for (const record of attendance) {
    if (record.status === "HADIR") hadir += 1;
    else if (record.status === "IZIN") izin += 1;
    else if (record.status === "ALPA") alpa += 1;
  }
  return { hadir, izin, alpa, recorded: attendance.length };
}

export async function getDashboardStatsAction(): Promise<DashboardStats> {
  const session = await requireUser();

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [
    memberCount,
    totalParticipantEmails,
    todayEvent,
    latestEvent,
    pemasukanAgg,
    pengeluaranAgg,
    latestTransactions,
    latestParticipants,
    latestAnnouncements,
    announcementsTotal,
  ] = await Promise.all([
    prisma.member.count(),
    prisma.member.count({ where: { email: { not: null } } }),
    prisma.activityEvent.findFirst({
      where: { date: { gte: startOfDay, lte: endOfDay } },
      orderBy: { date: "desc" },
      include: { attendance: { select: { memberId: true, status: true } } },
    }),
    prisma.activityEvent.findFirst({
      orderBy: { date: "desc" },
      include: { attendance: { select: { memberId: true, status: true } } },
    }),
    prisma.transaction.aggregate({
      where: { type: "PEMASUKAN" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "PENGELUARAN" },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      orderBy: { date: "desc" },
      take: 5,
      select: {
        id: true,
        type: true,
        category: true,
        amount: true,
        description: true,
        date: true,
      },
    }),
    prisma.member.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.announcement.findMany({
      orderBy: { sentAt: "desc" },
      take: 3,
      select: { id: true, subject: true, body: true, sentAt: true },
    }),
    prisma.announcement.count(),
  ]);

  const pemasukan = pemasukanAgg._sum.amount ?? 0;
  const pengeluaran = pengeluaranAgg._sum.amount ?? 0;

  return {
    currentUser: { id: session.id, name: session.name, role: session.role },
    memberCount,
    totalParticipantEmails,
    todayEvent: todayEvent
      ? {
          id: todayEvent.id,
          name: todayEvent.name,
          date: todayEvent.date.toISOString(),
          ...summarizeAttendance(todayEvent.attendance),
        }
      : null,
    latestEvent: latestEvent
      ? {
          id: latestEvent.id,
          name: latestEvent.name,
          date: latestEvent.date.toISOString(),
          ...summarizeAttendance(latestEvent.attendance),
        }
      : null,
    cashSummary: { pemasukan, pengeluaran, saldo: pemasukan - pengeluaran },
    latestTransactions: latestTransactions.map((t) => ({
      id: t.id,
      type: t.type as "PEMASUKAN" | "PENGELUARAN",
      category: t.category,
      amount: t.amount,
      description: t.description,
      date: t.date.toISOString(),
    })),
    latestParticipants: latestParticipants.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      createdAt: p.createdAt.toISOString(),
    })),
    announcementsTotal,
    latestAnnouncements: latestAnnouncements.map((a) => ({
      id: a.id,
      subject: a.subject,
      body: a.body,
      sentAt: a.sentAt.toISOString(),
    })),
  };
}

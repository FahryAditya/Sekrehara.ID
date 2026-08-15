"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";

export type DashboardStats = {
  memberCount: number;
  activeMemberCount: number;
  todayTasks: number;
  overdueTasks: number;
  thisWeekAgenda: number;
  latestAnnouncements: {
    id: string;
    subject: string;
    body: string;
    recipientCount: number;
    sentAt: string;
  }[];
  latestMeetings: {
    id: string;
    title: string;
    scheduledDate: string;
    status: string;
  }[];
  pendingLetters: number;
  activeWorkPrograms: number;
  unreadNotifications: number;
};

export async function getDashboardStatsAction(): Promise<DashboardStats> {
  const session = await requireUser();

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const [
    memberCount,
    activeMemberCount,
    todayTasks,
    overdueTasks,
    thisWeekAgenda,
    latestAnnouncements,
    latestMeetings,
    pendingLetters,
    activeWorkPrograms,
    unreadNotifications,
  ] = await Promise.all([
    prisma.member.count(),
    prisma.member.count({ where: { status: "AKTIF" } }),
    prisma.task.count({
      where: { deadline: { gte: startOfDay, lte: endOfDay }, status: { notIn: ["DONE", "CANCELLED"] } },
    }),
    prisma.task.count({ where: { deadline: { lt: now }, status: { notIn: ["DONE", "CANCELLED"] } } }),
    prisma.agenda.count({ where: { startDate: { gte: startOfWeek, lt: endOfWeek }, status: { notIn: ["BATAL"] } } }),
    prisma.announcement.findMany({ orderBy: { sentAt: "desc" }, take: 5 }),
    prisma.meeting.findMany({
      orderBy: { scheduledDate: "desc" },
      take: 5,
      select: { id: true, title: true, scheduledDate: true, status: true },
    }),
    prisma.letter.count({ where: { status: "REVIEW" } }),
    prisma.workProgram.count({
      where: { status: { in: ["PLANNING", "IN_PROGRESS"] } },
    }),
    prisma.notification.count({ where: { userId: session.id, isRead: false } }),
  ]);

  return {
    memberCount,
    activeMemberCount,
    todayTasks,
    overdueTasks,
    thisWeekAgenda,
    latestAnnouncements: latestAnnouncements.map((a) => ({
      id: a.id,
      subject: a.subject,
      body: a.body,
      recipientCount: a.recipientCount,
      sentAt: a.sentAt.toISOString(),
    })),
    latestMeetings: latestMeetings.map((m) => ({
      id: m.id,
      title: m.title,
      scheduledDate: m.scheduledDate.toISOString(),
      status: m.status,
    })),
    pendingLetters,
    activeWorkPrograms,
    unreadNotifications,
  };
}

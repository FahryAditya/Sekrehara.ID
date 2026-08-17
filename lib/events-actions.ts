"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import type { AttendanceStatus } from "./generated/prisma/enums";

export type EventItem = {
  id: string;
  name: string;
  date: string;
  description: string | null;
  createdAt: string;
  recordedCount: number;
};

export type EventInput = {
  name: string;
  date: string;
  description?: string | null;
};

export type EventActionResult = { ok: true; id: string } | { error: string };

export type EventAttendanceItem = {
  memberId: string;
  memberName: string;
  memberEmail: string | null;
  status: AttendanceStatus | null;
};

export async function listEventsAction(): Promise<EventItem[]> {
  await requireUser();

  const events = await prisma.activityEvent.findMany({
    orderBy: { date: "desc" },
    include: { _count: { select: { attendance: true } } },
  });

  return events.map((event) => ({
    id: event.id,
    name: event.name,
    date: event.date.toISOString(),
    description: event.description,
    createdAt: event.createdAt.toISOString(),
    recordedCount: event._count.attendance,
  }));
}

export async function createEventAction(input: EventInput): Promise<EventActionResult> {
  const session = await requirePermission("manage_members");

  const name = input.name.trim();
  if (!name) return { error: "Nama kegiatan wajib diisi." };
  if (!input.date) return { error: "Tanggal kegiatan wajib diisi." };

  const event = await prisma.activityEvent.create({
    data: {
      name,
      date: new Date(input.date),
      description: input.description?.trim() || null,
    },
  });

  await createActivityLog(session.id, "CREATE", "ACTIVITY_EVENT", event.id, `Membuat kegiatan ${name}`);
  return { ok: true, id: event.id };
}

export async function deleteEventAction(id: string): Promise<{ ok: true } | { error: string }> {
  const session = await requirePermission("manage_members");

  const existing = await prisma.activityEvent.findUnique({ where: { id } });
  if (!existing) return { error: "Kegiatan tidak ditemukan." };

  await prisma.activityEvent.delete({ where: { id } });
  await createActivityLog(session.id, "DELETE", "ACTIVITY_EVENT", id, `Menghapus kegiatan ${existing.name}`);
  return { ok: true };
}

export async function listEventAttendanceAction(eventId: string): Promise<EventAttendanceItem[]> {
  await requireUser();

  const [members, attendance] = await Promise.all([
    prisma.member.findMany({
      where: { status: "AKTIF" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    prisma.attendance.findMany({
      where: { eventId },
      select: { memberId: true, status: true },
    }),
  ]);

  const statusMap = new Map(attendance.map((record) => [record.memberId, record.status]));

  return members.map((member) => ({
    memberId: member.id,
    memberName: member.name,
    memberEmail: member.email,
    status: (statusMap.get(member.id) as AttendanceStatus | undefined) ?? null,
  }));
}

export async function listAllAttendanceAction(): Promise<
  Record<string, Record<string, AttendanceStatus>>
> {
  await requireUser();

  const records = await prisma.attendance.findMany({
    select: { eventId: true, memberId: true, status: true },
  });

  const map: Record<string, Record<string, AttendanceStatus>> = {};
  for (const record of records) {
    map[record.eventId] ??= {};
    map[record.eventId][record.memberId] = record.status as AttendanceStatus;
  }
  return map;
}

export type EventDetailResult =
  | { ok: true; event: EventItem; attendance: Record<string, AttendanceStatus> }
  | { error: string };

export async function getEventWithAttendanceAction(
  eventId: string
): Promise<EventDetailResult> {
  await requireUser();

  const event = await prisma.activityEvent.findUnique({
    where: { id: eventId },
    include: {
      attendance: { select: { memberId: true, status: true } },
      _count: { select: { attendance: true } },
    },
  });
  if (!event) return { error: "Kegiatan tidak ditemukan." };

  const attendance: Record<string, AttendanceStatus> = {};
  for (const record of event.attendance) {
    attendance[record.memberId] = record.status as AttendanceStatus;
  }

  return {
    ok: true,
    event: {
      id: event.id,
      name: event.name,
      date: event.date.toISOString(),
      description: event.description,
      createdAt: event.createdAt.toISOString(),
      recordedCount: event._count.attendance,
    },
    attendance,
  };
}

export async function setAttendanceStatusAction(
  eventId: string,
  memberId: string,
  status: AttendanceStatus
): Promise<{ ok: true } | { error: string }> {
  const session = await requirePermission("manage_members");

  const event = await prisma.activityEvent.findUnique({ where: { id: eventId } });
  if (!event) return { error: "Kegiatan tidak ditemukan." };

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) return { error: "Anggota tidak ditemukan." };

  await prisma.attendance.upsert({
    where: { eventId_memberId: { eventId, memberId } },
    update: { status },
    create: { eventId, memberId, status },
  });

  await createActivityLog(
    session.id,
    "UPDATE",
    "ATTENDANCE",
    undefined,
    `Kehadiran ${member.name} di "${event.name}" diubah menjadi ${status}`
  );

  return { ok: true };
}

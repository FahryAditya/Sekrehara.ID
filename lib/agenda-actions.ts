"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import type { AgendaStatus, RsvpStatus } from "./generated/prisma/enums";

export type AgendaItem = {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  location: string | null;
  status: AgendaStatus;
  createdById: string | null;
  participantCount: number;
};

export type AgendaDetail = AgendaItem & {
  participants: {
    memberId: string;
    memberName: string;
    rsvpStatus: RsvpStatus;
  }[];
};

export type AgendaInput = {
  title: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  status?: AgendaStatus;
  participantIds?: string[];
};

export type AgendaActionResult = { ok: true; id: string } | { error: string };

export type AgendaListQuery = {
  page?: number;
  pageSize?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
};

export type AgendaListResult = {
  data: AgendaItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listAgendaAction(query: AgendaListQuery = {}): Promise<AgendaListResult> {
  await requireUser();

  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 10));

  const where: {
    status?: AgendaStatus;
    title?: { contains: string; mode: "insensitive" };
    startDate?: { gte?: Date; lte?: Date };
  } = {};

  if (query.status && query.status !== "ALL") where.status = query.status as AgendaStatus;
  if (query.search) {
    where.title = { contains: query.search.trim(), mode: "insensitive" };
  }
  if (query.dateFrom || query.dateTo) {
    where.startDate = {};
    if (query.dateFrom) where.startDate.gte = new Date(query.dateFrom);
    if (query.dateTo) where.startDate.lte = new Date(query.dateTo);
  }

  const [total, rows] = await Promise.all([
    prisma.agenda.count({ where }),
    prisma.agenda.findMany({
      where,
      orderBy: { startDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { participants: true } } },
    }),
  ]);

  return {
    data: rows.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      startDate: a.startDate.toISOString(),
      endDate: a.endDate?.toISOString() ?? null,
      location: a.location,
      status: a.status as AgendaStatus,
      createdById: a.createdById,
      participantCount: a._count.participants,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getCalendarAgendaAction(month: number, year: number): Promise<AgendaItem[]> {
  await requireUser();

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const rows = await prisma.agenda.findMany({
    where: {
      startDate: { gte: start, lt: end },
    },
    orderBy: { startDate: "asc" },
    include: { _count: { select: { participants: true } } },
  });

  return rows.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    startDate: a.startDate.toISOString(),
    endDate: a.endDate?.toISOString() ?? null,
    location: a.location,
    status: a.status as AgendaStatus,
    createdById: a.createdById,
    participantCount: a._count.participants,
  }));
}

export async function getAgendaAction(id: string): Promise<AgendaDetail | null> {
  await requireUser();
  const agenda = await prisma.agenda.findUnique({
    where: { id },
    include: {
      participants: { include: { member: true } },
    },
  });
  if (!agenda) return null;

  return {
    id: agenda.id,
    title: agenda.title,
    description: agenda.description,
    startDate: agenda.startDate.toISOString(),
    endDate: agenda.endDate?.toISOString() ?? null,
    location: agenda.location,
    status: agenda.status as AgendaStatus,
    createdById: agenda.createdById,
    participantCount: agenda.participants.length,
    participants: agenda.participants.map((p) => ({
      memberId: p.memberId,
      memberName: p.member.name,
      rsvpStatus: p.rsvpStatus as RsvpStatus,
    })),
  };
}

export async function createAgendaAction(input: AgendaInput): Promise<AgendaActionResult> {
  const session = await requirePermission("create_agenda");

  const title = input.title.trim();
  if (!title) return { error: "Judul agenda wajib diisi." };
  if (!input.startDate) return { error: "Tanggal mulai wajib diisi." };

  const startDate = new Date(input.startDate);
  if (input.endDate && new Date(input.endDate) <= startDate) {
    return { error: "Waktu selesai harus setelah waktu mulai." };
  }

  const agenda = await prisma.agenda.create({
    data: {
      title,
      description: input.description?.trim() || null,
      startDate,
      endDate: input.endDate ? new Date(input.endDate) : null,
      location: input.location?.trim() || null,
      status: input.status ?? "DRAFT",
      createdById: session.id,
      participants: input.participantIds?.length
        ? { create: input.participantIds.map((memberId) => ({ memberId })) }
        : undefined,
    },
  });

  await createActivityLog(session.id, "CREATE", "AGENDA", agenda.id, `Membuat agenda ${title}`);
  return { ok: true, id: agenda.id };
}

export async function updateAgendaAction(
  id: string,
  input: AgendaInput
): Promise<AgendaActionResult> {
  const session = await requirePermission("manage_agenda");
  const existing = await prisma.agenda.findUnique({
    where: { id },
    include: { participants: true },
  });
  if (!existing) return { error: "Agenda tidak ditemukan." };

  const title = input.title.trim();
  if (!title) return { error: "Judul agenda wajib diisi." };

  const startDate = new Date(input.startDate);
  if (input.endDate && new Date(input.endDate) <= startDate) {
    return { error: "Waktu selesai harus setelah waktu mulai." };
  }

  const participantIds = input.participantIds ?? existing.participants.map((p) => p.memberId);

  await prisma.agenda.update({
    where: { id },
    data: {
      title,
      description: input.description?.trim() || null,
      startDate,
      endDate: input.endDate ? new Date(input.endDate) : null,
      location: input.location?.trim() || null,
      status: input.status ?? existing.status,
      participants: { deleteMany: {}, create: participantIds.map((memberId) => ({ memberId })) },
    },
  });

  await createActivityLog(session.id, "UPDATE", "AGENDA", id, `Mengubah agenda ${title}`);
  return { ok: true, id };
}

export async function deleteAgendaAction(id: string): Promise<{ ok: true } | { error: string }> {
  const session = await requirePermission("manage_agenda");
  const existing = await prisma.agenda.findUnique({ where: { id } });
  if (!existing) return { error: "Agenda tidak ditemukan." };

  await prisma.agenda.delete({ where: { id } });
  await createActivityLog(session.id, "DELETE", "AGENDA", id, `Menghapus agenda ${existing.title}`);
  return { ok: true };
}

export async function updateRsvpAction(
  agendaId: string,
  rsvpStatus: RsvpStatus
): Promise<{ ok: true } | { error: string }> {
  const session = await requireUser();

  const member = await prisma.member.findUnique({ where: { userId: session.id } });
  if (!member) return { error: "Akun Anda belum terhubung ke data anggota." };

  const participant = await prisma.agendaParticipant.findUnique({
    where: { agendaId_memberId: { agendaId, memberId: member.id } },
  });
  if (!participant) return { error: "Anda tidak termasuk peserta agenda ini." };

  await prisma.agendaParticipant.update({
    where: { id: participant.id },
    data: { rsvpStatus },
  });

  return { ok: true };
}

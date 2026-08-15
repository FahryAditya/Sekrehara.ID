"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import type {
  MeetingStatus,
  MeetingAttendanceStatus,
  ActionItemStatus,
  Priority,
} from "./generated/prisma/enums";

export type MeetingItem = {
  id: string;
  title: string;
  description: string | null;
  scheduledDate: string;
  location: string | null;
  status: MeetingStatus;
  picName: string | null;
  participantCount: number;
  attendanceCount: number;
};

export type MeetingDetail = MeetingItem & {
  participants: { memberId: string; memberName: string }[];
  attendance: {
    memberId: string;
    memberName: string;
    status: MeetingAttendanceStatus;
    keterangan: string | null;
  }[];
  notes: { id: string; content: string; createdAt: string }[];
  decisions: { id: string; decision: string; createdAt: string }[];
  actionItems: {
    id: string;
    description: string;
    assignedToName: string | null;
    deadline: string | null;
    priority: Priority;
    status: ActionItemStatus;
  }[];
};

export type MeetingInput = {
  title: string;
  description?: string | null;
  scheduledDate: string;
  location?: string | null;
  picId?: string | null;
  status?: MeetingStatus;
  participantIds?: string[];
};

export type MeetingActionResult = { ok: true; id: string } | { error: string };

export async function listMeetingsAction(): Promise<MeetingItem[]> {
  await requireUser();
  const rows = await prisma.meeting.findMany({
    orderBy: { scheduledDate: "desc" },
    include: {
      pic: true,
      _count: { select: { participants: true, attendance: true } },
    },
  });
  return rows.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    scheduledDate: m.scheduledDate.toISOString(),
    location: m.location,
    status: m.status as MeetingStatus,
    picName: m.pic?.name ?? null,
    participantCount: m._count.participants,
    attendanceCount: m._count.attendance,
  }));
}

export async function getMeetingAction(id: string): Promise<MeetingDetail | null> {
  await requireUser();
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      pic: true,
      participants: { include: { member: true } },
      attendance: { include: { member: true } },
      notes: true,
      decisions: true,
      actionItems: { include: { assignee: true } },
    },
  });
  if (!meeting) return null;

  return {
    id: meeting.id,
    title: meeting.title,
    description: meeting.description,
    scheduledDate: meeting.scheduledDate.toISOString(),
    location: meeting.location,
    status: meeting.status as MeetingStatus,
    picName: meeting.pic?.name ?? null,
    participantCount: meeting.participants.length,
    attendanceCount: meeting.attendance.length,
    participants: meeting.participants.map((p) => ({
      memberId: p.memberId,
      memberName: p.member.name,
    })),
    attendance: meeting.attendance.map((a) => ({
      memberId: a.memberId,
      memberName: a.member.name,
      status: a.status as MeetingAttendanceStatus,
      keterangan: a.keterangan,
    })),
    notes: meeting.notes.map((n) => ({
      id: n.id,
      content: n.content,
      createdAt: n.createdAt.toISOString(),
    })),
    decisions: meeting.decisions.map((d) => ({
      id: d.id,
      decision: d.decision,
      createdAt: d.createdAt.toISOString(),
    })),
    actionItems: meeting.actionItems.map((a) => ({
      id: a.id,
      description: a.description,
      assignedToName: a.assignee?.name ?? null,
      deadline: a.deadline?.toISOString() ?? null,
      priority: a.priority as Priority,
      status: a.status as ActionItemStatus,
    })),
  };
}

export async function createMeetingAction(input: MeetingInput): Promise<MeetingActionResult> {
  const session = await requirePermission("manage_meetings");
  const title = input.title.trim();
  if (!title) return { error: "Nama rapat wajib diisi." };
  if (!input.scheduledDate) return { error: "Tanggal rapat wajib diisi." };

  const meeting = await prisma.meeting.create({
    data: {
      title,
      description: input.description?.trim() || null,
      scheduledDate: new Date(input.scheduledDate),
      location: input.location?.trim() || null,
      picId: input.picId || null,
      status: input.status ?? "DRAFT",
      createdById: session.id,
      participants: input.participantIds?.length
        ? { create: input.participantIds.map((memberId) => ({ memberId })) }
        : undefined,
    },
  });

  await createActivityLog(session.id, "CREATE", "MEETING", meeting.id, `Membuat rapat ${title}`);
  return { ok: true, id: meeting.id };
}

export async function updateMeetingAction(
  id: string,
  input: MeetingInput
): Promise<MeetingActionResult> {
  const session = await requirePermission("manage_meetings");
  const existing = await prisma.meeting.findUnique({
    where: { id },
    include: { participants: true },
  });
  if (!existing) return { error: "Rapat tidak ditemukan." };

  const title = input.title.trim();
  if (!title) return { error: "Nama rapat wajib diisi." };

  const participantIds = input.participantIds ?? existing.participants.map((p) => p.memberId);

  await prisma.meeting.update({
    where: { id },
    data: {
      title,
      description: input.description?.trim() || null,
      scheduledDate: new Date(input.scheduledDate),
      location: input.location?.trim() || null,
      picId: input.picId ?? null,
      status: input.status ?? existing.status,
      participants: { deleteMany: {}, create: participantIds.map((memberId) => ({ memberId })) },
    },
  });

  await createActivityLog(session.id, "UPDATE", "MEETING", id, `Mengubah rapat ${title}`);
  return { ok: true, id };
}

export async function deleteMeetingAction(id: string): Promise<{ ok: true } | { error: string }> {
  const session = await requirePermission("manage_meetings");
  const existing = await prisma.meeting.findUnique({ where: { id } });
  if (!existing) return { error: "Rapat tidak ditemukan." };

  await prisma.meeting.delete({ where: { id } });
  await createActivityLog(session.id, "DELETE", "MEETING", id, `Menghapus rapat ${existing.title}`);
  return { ok: true };
}

export type MeetingAttendanceInput = {
  meetingId: string;
  records: { memberId: string; status: MeetingAttendanceStatus; keterangan?: string }[];
};

export async function saveMeetingAttendanceAction(
  input: MeetingAttendanceInput
): Promise<{ ok: true } | { error: string }> {
  const session = await requirePermission("manage_meetings");
  const meeting = await prisma.meeting.findUnique({ where: { id: input.meetingId } });
  if (!meeting) return { error: "Rapat tidak ditemukan." };

  await prisma.$transaction(
    input.records.map((record) =>
      prisma.meetingAttendance.upsert({
        where: {
          meetingId_memberId: { meetingId: input.meetingId, memberId: record.memberId },
        },
        update: { status: record.status, keterangan: record.keterangan || null },
        create: {
          meetingId: input.meetingId,
          memberId: record.memberId,
          status: record.status,
          keterangan: record.keterangan || null,
        },
      })
    )
  );

  await createActivityLog(
    session.id,
    "UPDATE_ATTENDANCE",
    "MEETING",
    input.meetingId,
    `Memperbarui absensi rapat ${meeting.title}`
  );
  return { ok: true };
}

export type MeetingNoteInput = {
  meetingId: string;
  content: string;
};

export async function addMeetingNoteAction(
  input: MeetingNoteInput
): Promise<{ ok: true; id: string } | { error: string }> {
  const session = await requirePermission("manage_meetings");
  if (!input.content.trim()) return { error: "Isi notulen tidak boleh kosong." };

  const note = await prisma.meetingNote.create({
    data: { meetingId: input.meetingId, content: input.content.trim(), createdById: session.id },
  });

  await createActivityLog(session.id, "ADD_NOTE", "MEETING", input.meetingId, "Menambah notulen");
  return { ok: true, id: note.id };
}

export async function deleteMeetingNoteAction(
  noteId: string
): Promise<{ ok: true } | { error: string }> {
  const session = await requirePermission("manage_meetings");
  const note = await prisma.meetingNote.findUnique({ where: { id: noteId } });
  if (!note) return { error: "Notulen tidak ditemukan." };

  await prisma.meetingNote.delete({ where: { id: noteId } });
  await createActivityLog(session.id, "DELETE_NOTE", "MEETING", note.meetingId, "Menghapus notulen");
  return { ok: true };
}

export type MeetingDecisionInput = {
  meetingId: string;
  decision: string;
};

export async function addMeetingDecisionAction(
  input: MeetingDecisionInput
): Promise<{ ok: true; id: string } | { error: string }> {
  const session = await requirePermission("manage_meetings");
  if (!input.decision.trim()) return { error: "Keputusan tidak boleh kosong." };

  const decision = await prisma.meetingDecision.create({
    data: { meetingId: input.meetingId, decision: input.decision.trim(), createdById: session.id },
  });

  await createActivityLog(session.id, "ADD_DECISION", "MEETING", input.meetingId, "Menambah keputusan");
  return { ok: true, id: decision.id };
}

export async function deleteMeetingDecisionAction(
  decisionId: string
): Promise<{ ok: true } | { error: string }> {
  const session = await requirePermission("manage_meetings");
  const decision = await prisma.meetingDecision.findUnique({ where: { id: decisionId } });
  if (!decision) return { error: "Keputusan tidak ditemukan." };

  await prisma.meetingDecision.delete({ where: { id: decisionId } });
  await createActivityLog(
    session.id,
    "DELETE_DECISION",
    "MEETING",
    decision.meetingId,
    "Menghapus keputusan"
  );
  return { ok: true };
}

export type ActionItemInput = {
  meetingId: string;
  description: string;
  assignedTo?: string | null;
  deadline?: string | null;
  priority?: Priority;
};

export async function addActionItemAction(
  input: ActionItemInput
): Promise<{ ok: true; id: string } | { error: string }> {
  const session = await requirePermission("manage_meetings");
  if (!input.description.trim()) return { error: "Deskripsi tindak lanjut wajib diisi." };

  const item = await prisma.meetingActionItem.create({
    data: {
      meetingId: input.meetingId,
      description: input.description.trim(),
      assignedTo: input.assignedTo || null,
      deadline: input.deadline ? new Date(input.deadline) : null,
      priority: input.priority ?? "MEDIUM",
    },
  });

  await createActivityLog(session.id, "ADD_ACTION_ITEM", "MEETING", input.meetingId, "Menambah tindak lanjut");
  return { ok: true, id: item.id };
}

export type UpdateActionItemInput = {
  actionItemId: string;
  status?: ActionItemStatus;
  description?: string;
  assignedTo?: string | null;
  deadline?: string | null;
  priority?: Priority;
};

export async function updateActionItemAction(
  input: UpdateActionItemInput
): Promise<{ ok: true } | { error: string }> {
  const session = await requirePermission("manage_meetings");
  const item = await prisma.meetingActionItem.findUnique({
    where: { id: input.actionItemId },
  });
  if (!item) return { error: "Tindak lanjut tidak ditemukan." };

  await prisma.meetingActionItem.update({
    where: { id: input.actionItemId },
    data: {
      status: input.status ?? item.status,
      description: input.description?.trim() || item.description,
      assignedTo: input.assignedTo === undefined ? item.assignedTo : input.assignedTo,
      deadline:
        input.deadline === undefined ? item.deadline : input.deadline ? new Date(input.deadline) : null,
      priority: input.priority ?? item.priority,
    },
  });

  await createActivityLog(session.id, "UPDATE_ACTION_ITEM", "MEETING", item.meetingId, "Mengubah tindak lanjut");
  return { ok: true };
}

export async function deleteActionItemAction(
  actionItemId: string
): Promise<{ ok: true } | { error: string }> {
  const session = await requirePermission("manage_meetings");
  const item = await prisma.meetingActionItem.findUnique({ where: { id: actionItemId } });
  if (!item) return { error: "Tindak lanjut tidak ditemukan." };

  await prisma.meetingActionItem.delete({ where: { id: actionItemId } });
  await createActivityLog(session.id, "DELETE_ACTION_ITEM", "MEETING", item.meetingId, "Menghapus tindak lanjut");
  return { ok: true };
}

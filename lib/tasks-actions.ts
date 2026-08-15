"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import { createNotification } from "@/lib/notifications-actions";
import type { TaskStatus, Priority } from "./generated/prisma/enums";

export type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  deadline: string | null;
  assignedToName: string | null;
  createdAt: string;
};

export type TaskDetail = TaskItem & {
  comments: {
    id: string;
    content: string;
    userName: string | null;
    createdAt: string;
  }[];
  attachments: {
    id: string;
    fileUrl: string;
    fileName: string;
    fileSize: number | null;
    uploadedAt: string;
  }[];
};

export type TaskInput = {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: Priority;
  deadline?: string | null;
  assignedTo?: string | null;
  workProgramIds?: string[];
};

export type TaskActionResult = { ok: true; id: string } | { error: string };

export type TaskListQuery = {
  page?: number;
  pageSize?: number;
  status?: string;
  priority?: string;
  assignedTo?: string;
  search?: string;
  sort?: string;
};

export type TaskListResult = {
  data: TaskItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listTasksAction(query: TaskListQuery = {}): Promise<TaskListResult> {
  await requireUser();

  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 10));

  const where: {
    status?: TaskStatus;
    priority?: Priority;
    assignedTo?: string;
    title?: { contains: string; mode: "insensitive" };
  } = {};

  if (query.status && query.status !== "ALL") where.status = query.status as TaskStatus;
  if (query.priority && query.priority !== "ALL") where.priority = query.priority as Priority;
  if (query.assignedTo) where.assignedTo = query.assignedTo;
  if (query.search) where.title = { contains: query.search.trim(), mode: "insensitive" };

  const orderBy: Record<string, "asc" | "desc">[] = [];
  switch (query.sort) {
    case "priority":
      orderBy.push({ priority: "asc" });
      break;
    case "created":
      orderBy.push({ createdAt: "desc" });
      break;
    case "deadline":
    default:
      orderBy.push({ deadline: "asc" });
  }

  const [total, rows] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { assignee: true },
    }),
  ]);

  return {
    data: rows.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status as TaskStatus,
      priority: t.priority as Priority,
      deadline: t.deadline?.toISOString() ?? null,
      assignedToName: t.assignee?.name ?? null,
      createdAt: t.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getTaskAction(id: string): Promise<TaskDetail | null> {
  await requireUser();
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: true,
      comments: { include: { user: true }, orderBy: { createdAt: "asc" } },
      attachments: true,
    },
  });
  if (!task) return null;

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status as TaskStatus,
    priority: task.priority as Priority,
    deadline: task.deadline?.toISOString() ?? null,
    assignedToName: task.assignee?.name ?? null,
    createdAt: task.createdAt.toISOString(),
    comments: task.comments.map((c) => ({
      id: c.id,
      content: c.content,
      userName: c.user?.name ?? null,
      createdAt: c.createdAt.toISOString(),
    })),
    attachments: task.attachments.map((a) => ({
      id: a.id,
      fileUrl: a.fileUrl,
      fileName: a.fileName,
      fileSize: a.fileSize,
      uploadedAt: a.uploadedAt.toISOString(),
    })),
  };
}

export async function createTaskAction(input: TaskInput): Promise<TaskActionResult> {
  const session = await requirePermission("manage_tasks");
  const title = input.title.trim();
  if (!title) return { error: "Judul tugas wajib diisi." };

  const task = await prisma.task.create({
    data: {
      title,
      description: input.description?.trim() || null,
      status: input.status ?? "TODO",
      priority: input.priority ?? "MEDIUM",
      deadline: input.deadline ? new Date(input.deadline) : null,
      assignedTo: input.assignedTo || null,
      createdById: session.id,
      workPrograms: input.workProgramIds?.length
        ? { create: input.workProgramIds.map((workProgramId) => ({ workProgramId })) }
        : undefined,
    },
    include: { assignee: true },
  });

  if (task.assignedTo) {
    const assignedMember = await prisma.member.findUnique({
      where: { id: task.assignedTo },
      select: { userId: true },
    });
    if (assignedMember?.userId) {
      await createNotification(assignedMember.userId, {
        type: "TASK_ASSIGNED",
        title: "Tugas baru ditugaskan",
        message: title,
        relatedEntityType: "TASK",
        relatedEntityId: task.id,
      });
    }
  }

  await createActivityLog(session.id, "CREATE", "TASK", task.id, `Membuat tugas ${title}`);
  return { ok: true, id: task.id };
}

export async function updateTaskAction(id: string, input: TaskInput): Promise<TaskActionResult> {
  const session = await requirePermission("manage_tasks");
  const existing = await prisma.task.findUnique({
    where: { id },
    include: { workPrograms: true },
  });
  if (!existing) return { error: "Tugas tidak ditemukan." };

  const title = input.title.trim();
  if (!title) return { error: "Judul tugas wajib diisi." };

  const workProgramIds = input.workProgramIds ?? existing.workPrograms.map((w) => w.workProgramId);

  const task = await prisma.task.update({
    where: { id },
    data: {
      title,
      description: input.description?.trim() || null,
      status: input.status ?? existing.status,
      priority: input.priority ?? existing.priority,
      deadline: input.deadline === undefined ? existing.deadline : input.deadline ? new Date(input.deadline) : null,
      assignedTo: input.assignedTo === undefined ? existing.assignedTo : input.assignedTo,
      workPrograms: { deleteMany: {}, create: workProgramIds.map((workProgramId) => ({ workProgramId })) },
    },
  });

  await createActivityLog(session.id, "UPDATE", "TASK", id, `Mengubah tugas ${title}`);
  return { ok: true, id: task.id };
}

export async function deleteTaskAction(id: string): Promise<{ ok: true } | { error: string }> {
  const session = await requirePermission("manage_tasks");
  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) return { error: "Tugas tidak ditemukan." };

  await prisma.task.delete({ where: { id } });
  await createActivityLog(session.id, "DELETE", "TASK", id, `Menghapus tugas ${existing.title}`);
  return { ok: true };
}

export async function updateTaskStatusAction(
  id: string,
  status: TaskStatus
): Promise<{ ok: true } | { error: string }> {
  const session = await requireUser();
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return { error: "Tugas tidak ditemukan." };

  const member = await prisma.member.findUnique({ where: { userId: session.id } });
  const isAssignee = task.assignedTo !== null && member !== null && task.assignedTo === member.id;
  const isCreator = task.createdById === session.id;

  if (!isAssignee && !isCreator && session.role !== "ADMIN" && session.role !== "SUPERADMIN") {
    return { error: "Anda tidak berhak mengubah status tugas ini." };
  }

  await prisma.task.update({ where: { id }, data: { status } });
  return { ok: true };
}

export type TaskCommentInput = {
  taskId: string;
  content: string;
};

export async function addTaskCommentAction(
  input: TaskCommentInput
): Promise<{ ok: true; id: string } | { error: string }> {
  const session = await requireUser();
  if (!input.content.trim()) return { error: "Komentar tidak boleh kosong." };

  const comment = await prisma.taskComment.create({
    data: { taskId: input.taskId, content: input.content.trim(), userId: session.id },
  });

  return { ok: true, id: comment.id };
}

export async function deleteTaskCommentAction(
  commentId: string
): Promise<{ ok: true } | { error: string }> {
  const session = await requireUser();
  const comment = await prisma.taskComment.findUnique({ where: { id: commentId } });
  if (!comment) return { error: "Komentar tidak ditemukan." };

  if (comment.userId !== session.id) {
    return { error: "Anda hanya dapat menghapus komentar sendiri." };
  }

  await prisma.taskComment.delete({ where: { id: commentId } });
  return { ok: true };
}

export type TaskAttachmentInput = {
  taskId: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number | null;
};

export async function addTaskAttachmentAction(
  input: TaskAttachmentInput
): Promise<{ ok: true; id: string } | { error: string }> {
  const session = await requireUser();
  if (!input.fileUrl.trim() || !input.fileName.trim()) {
    return { error: "Data file tidak lengkap." };
  }

  const attachment = await prisma.taskAttachment.create({
    data: {
      taskId: input.taskId,
      fileUrl: input.fileUrl.trim(),
      fileName: input.fileName.trim(),
      fileSize: input.fileSize ?? null,
      uploadedById: session.id,
    },
  });

  return { ok: true, id: attachment.id };
}

export async function deleteTaskAttachmentAction(
  attachmentId: string
): Promise<{ ok: true } | { error: string }> {
  const session = await requireUser();
  const attachment = await prisma.taskAttachment.findUnique({
    where: { id: attachmentId },
  });
  if (!attachment) return { error: "Lampiran tidak ditemukan." };

  if (attachment.uploadedById !== session.id) {
    return { error: "Anda hanya dapat menghapus lampiran sendiri." };
  }

  await prisma.taskAttachment.delete({ where: { id: attachmentId } });
  return { ok: true };
}

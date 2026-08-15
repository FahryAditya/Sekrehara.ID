"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import type { WorkProgramStatus } from "./generated/prisma/enums";

export type WorkProgramItem = {
  id: string;
  name: string;
  description: string | null;
  sekbidName: string | null;
  picName: string | null;
  startDate: string | null;
  endDate: string | null;
  target: string | null;
  status: WorkProgramStatus;
  progressPercentage: number;
  taskCount: number;
};

export type WorkProgramDetail = WorkProgramItem & {
  updates: {
    id: string;
    description: string | null;
    progressPercentage: number;
    createdAt: string;
  }[];
  tasks: { id: string; title: string; status: string }[];
};

export type WorkProgramInput = {
  name: string;
  description?: string | null;
  sekbidId?: string | null;
  picId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  target?: string | null;
  status?: WorkProgramStatus;
  taskIds?: string[];
};

export type WorkProgramActionResult = { ok: true; id: string } | { error: string };

export async function listWorkProgramsAction(): Promise<WorkProgramItem[]> {
  await requireUser();
  const rows = await prisma.workProgram.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      sekbid: true,
      pic: true,
      _count: { select: { tasks: true } },
    },
  });
  return rows.map((w) => ({
    id: w.id,
    name: w.name,
    description: w.description,
    sekbidName: w.sekbid?.name ?? null,
    picName: w.pic?.name ?? null,
    startDate: w.startDate?.toISOString() ?? null,
    endDate: w.endDate?.toISOString() ?? null,
    target: w.target,
    status: w.status as WorkProgramStatus,
    progressPercentage: w.progressPercentage,
    taskCount: w._count.tasks,
  }));
}

export async function getWorkProgramAction(id: string): Promise<WorkProgramDetail | null> {
  await requireUser();
  const workProgram = await prisma.workProgram.findUnique({
    where: { id },
    include: {
      sekbid: true,
      pic: true,
      updates: { orderBy: { createdAt: "desc" } },
      tasks: { include: { task: true } },
    },
  });
  if (!workProgram) return null;

  return {
    id: workProgram.id,
    name: workProgram.name,
    description: workProgram.description,
    sekbidName: workProgram.sekbid?.name ?? null,
    picName: workProgram.pic?.name ?? null,
    startDate: workProgram.startDate?.toISOString() ?? null,
    endDate: workProgram.endDate?.toISOString() ?? null,
    target: workProgram.target,
    status: workProgram.status as WorkProgramStatus,
    progressPercentage: workProgram.progressPercentage,
    taskCount: workProgram.tasks.length,
    updates: workProgram.updates.map((u) => ({
      id: u.id,
      description: u.description,
      progressPercentage: u.progressPercentage,
      createdAt: u.createdAt.toISOString(),
    })),
    tasks: workProgram.tasks.map((t) => ({ id: t.task.id, title: t.task.title, status: t.task.status })),
  };
}

export async function createWorkProgramAction(
  input: WorkProgramInput
): Promise<WorkProgramActionResult> {
  const session = await requirePermission("manage_work_programs");
  const name = input.name.trim();
  if (!name) return { error: "Nama program kerja wajib diisi." };

  const workProgram = await prisma.workProgram.create({
    data: {
      name,
      description: input.description?.trim() || null,
      sekbidId: input.sekbidId || null,
      picId: input.picId || null,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      target: input.target?.trim() || null,
      status: input.status ?? "PLANNING",
      createdById: session.id,
      tasks: input.taskIds?.length
        ? { create: input.taskIds.map((taskId) => ({ taskId })) }
        : undefined,
    },
  });

  await createActivityLog(session.id, "CREATE", "WORK_PROGRAM", workProgram.id, `Membuat program kerja ${name}`);
  return { ok: true, id: workProgram.id };
}

export async function updateWorkProgramAction(
  id: string,
  input: WorkProgramInput
): Promise<WorkProgramActionResult> {
  const session = await requirePermission("manage_work_programs");
  const existing = await prisma.workProgram.findUnique({
    where: { id },
    include: { tasks: true },
  });
  if (!existing) return { error: "Program kerja tidak ditemukan." };

  const name = input.name.trim();
  if (!name) return { error: "Nama program kerja wajib diisi." };

  const taskIds = input.taskIds ?? existing.tasks.map((t) => t.taskId);

  const workProgram = await prisma.workProgram.update({
    where: { id },
    data: {
      name,
      description: input.description?.trim() || null,
      sekbidId: input.sekbidId || null,
      picId: input.picId || null,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      target: input.target?.trim() || null,
      status: input.status ?? existing.status,
      tasks: { deleteMany: {}, create: taskIds.map((taskId) => ({ taskId })) },
    },
  });

  await createActivityLog(session.id, "UPDATE", "WORK_PROGRAM", id, `Mengubah program kerja ${name}`);
  return { ok: true, id: workProgram.id };
}

export async function deleteWorkProgramAction(
  id: string
): Promise<{ ok: true } | { error: string }> {
  const session = await requirePermission("manage_work_programs");
  const existing = await prisma.workProgram.findUnique({ where: { id } });
  if (!existing) return { error: "Program kerja tidak ditemukan." };

  await prisma.workProgram.delete({ where: { id } });
  await createActivityLog(session.id, "DELETE", "WORK_PROGRAM", id, `Menghapus program kerja ${existing.name}`);
  return { ok: true };
}

export type UpdateProgressInput = {
  progressPercentage: number;
  description?: string | null;
};

export async function updateWorkProgramProgressAction(
  id: string,
  input: UpdateProgressInput
): Promise<WorkProgramActionResult> {
  const session = await requirePermission("manage_work_programs");
  const existing = await prisma.workProgram.findUnique({ where: { id } });
  if (!existing) return { error: "Program kerja tidak ditemukan." };

  const progress = Math.max(0, Math.min(100, Math.round(input.progressPercentage)));

  await prisma.$transaction([
    prisma.workProgram.update({
      where: { id },
      data: {
        progressPercentage: progress,
        status: progress >= 100 ? "COMPLETED" : existing.status === "PLANNING" && progress > 0 ? "IN_PROGRESS" : existing.status,
      },
    }),
    prisma.workProgramUpdate.create({
      data: {
        workProgramId: id,
        description: input.description?.trim() || null,
        progressPercentage: progress,
        createdById: session.id,
      },
    }),
  ]);

  await createActivityLog(
    session.id,
    "UPDATE_PROGRESS",
    "WORK_PROGRAM",
    id,
    `Progress ${existing.name} menjadi ${progress}%`
  );
  return { ok: true, id };
}

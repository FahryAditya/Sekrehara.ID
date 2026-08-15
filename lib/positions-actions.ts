"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";

export type PositionItem = {
  id: string;
  name: string;
  description: string | null;
  level: number;
  memberCount: number;
};

export type PositionInput = {
  name: string;
  description?: string | null;
  level?: number;
};

export type PositionActionResult = { ok: true; id: string } | { error: string };

export async function listPositionsAction(): Promise<PositionItem[]> {
  await requireUser();
  const rows = await prisma.position.findMany({
    orderBy: [{ level: "asc" }, { name: "asc" }],
    include: { members: true },
  });
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    level: p.level,
    memberCount: p.members.length,
  }));
}

export async function createPositionAction(input: PositionInput): Promise<PositionActionResult> {
  const session = await requirePermission("manage_positions");
  const name = input.name.trim();
  if (!name) return { error: "Nama jabatan wajib diisi." };

  const existing = await prisma.position.findUnique({ where: { name } });
  if (existing) return { error: "Jabatan dengan nama tersebut sudah ada." };

  const position = await prisma.position.create({
    data: {
      name,
      description: input.description?.trim() || null,
      level: input.level ?? 0,
    },
  });

  await createActivityLog(session.id, "CREATE", "POSITION", position.id, `Membuat jabatan ${name}`);
  return { ok: true, id: position.id };
}

export async function updatePositionAction(
  id: string,
  input: PositionInput
): Promise<PositionActionResult> {
  const session = await requirePermission("manage_positions");
  const existing = await prisma.position.findUnique({ where: { id } });
  if (!existing) return { error: "Jabatan tidak ditemukan." };

  const name = input.name.trim();
  if (!name) return { error: "Nama jabatan wajib diisi." };

  const dup = await prisma.position.findFirst({ where: { name, NOT: { id } } });
  if (dup) return { error: "Jabatan dengan nama tersebut sudah ada." };

  await prisma.position.update({
    where: { id },
    data: {
      name,
      description: input.description?.trim() || null,
      level: input.level ?? existing.level,
    },
  });

  await createActivityLog(session.id, "UPDATE", "POSITION", id, `Mengubah jabatan ${name}`);
  return { ok: true, id };
}

export async function deletePositionAction(id: string): Promise<{ ok: true } | { error: string }> {
  const session = await requirePermission("manage_positions");
  const existing = await prisma.position.findUnique({ where: { id } });
  if (!existing) return { error: "Jabatan tidak ditemukan." };

  await prisma.position.delete({ where: { id } });
  await createActivityLog(
    session.id,
    "DELETE",
    "POSITION",
    id,
    `Menghapus jabatan ${existing.name}`
  );
  return { ok: true };
}

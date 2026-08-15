"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";

export type SekbidItem = {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  memberCount: number;
};

export type SekbidInput = {
  name: string;
  description?: string | null;
  logoUrl?: string | null;
};

export type SekbidActionResult = { ok: true; id: string } | { error: string };

export async function listSekbidAction(): Promise<SekbidItem[]> {
  await requireUser();
  const rows = await prisma.sekbid.findMany({
    orderBy: { name: "asc" },
    include: { members: true },
  });
  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    logoUrl: s.logoUrl,
    memberCount: s.members.length,
  }));
}

export async function createSekbidAction(input: SekbidInput): Promise<SekbidActionResult> {
  const session = await requirePermission("manage_sekbid");
  const name = input.name.trim();
  if (!name) return { error: "Nama sekbid wajib diisi." };

  const existing = await prisma.sekbid.findUnique({ where: { name } });
  if (existing) return { error: "Sekbid dengan nama tersebut sudah ada." };

  const sekbid = await prisma.sekbid.create({
    data: {
      name,
      description: input.description?.trim() || null,
      logoUrl: input.logoUrl?.trim() || null,
    },
  });

  await createActivityLog(session.id, "CREATE", "SEKBID", sekbid.id, `Membuat sekbid ${name}`);
  return { ok: true, id: sekbid.id };
}

export async function updateSekbidAction(
  id: string,
  input: SekbidInput
): Promise<SekbidActionResult> {
  const session = await requirePermission("manage_sekbid");
  const existing = await prisma.sekbid.findUnique({ where: { id } });
  if (!existing) return { error: "Sekbid tidak ditemukan." };

  const name = input.name.trim();
  if (!name) return { error: "Nama sekbid wajib diisi." };

  const dup = await prisma.sekbid.findFirst({ where: { name, NOT: { id } } });
  if (dup) return { error: "Sekbid dengan nama tersebut sudah ada." };

  await prisma.sekbid.update({
    where: { id },
    data: {
      name,
      description: input.description?.trim() || null,
      logoUrl: input.logoUrl?.trim() || null,
    },
  });

  await createActivityLog(session.id, "UPDATE", "SEKBID", id, `Mengubah sekbid ${name}`);
  return { ok: true, id };
}

export async function deleteSekbidAction(id: string): Promise<{ ok: true } | { error: string }> {
  const session = await requirePermission("manage_sekbid");
  const existing = await prisma.sekbid.findUnique({ where: { id } });
  if (!existing) return { error: "Sekbid tidak ditemukan." };

  await prisma.sekbid.delete({ where: { id } });
  await createActivityLog(session.id, "DELETE", "SEKBID", id, `Menghapus sekbid ${existing.name}`);
  return { ok: true };
}

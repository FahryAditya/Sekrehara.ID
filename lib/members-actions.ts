"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import type { MemberStatus } from "./generated/prisma/enums";

export type MemberListItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  kelas: string | null;
  jurusan: string | null;
  nomorInduk: string | null;
  status: MemberStatus;
  joinDate: string | null;
  createdAt: string;
  sekbids: { id: string; name: string }[];
  positions: { id: string; name: string }[];
};

export type MemberListResult = {
  data: MemberListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type MemberListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  filterKelas?: string;
  filterStatus?: string;
  sort?: string;
};

export type MemberInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  kelas?: string | null;
  jurusan?: string | null;
  nomorInduk?: string | null;
  status?: MemberStatus;
  joinDate?: string | null;
  sekbidIds?: string[];
  positionIds?: string[];
};

export type MemberActionResult = { ok: true; id: string } | { error: string };

export type GetMemberResult = { ok: true; data: MemberListItem } | { error: string };

export async function listMembersAction(query: MemberListQuery = {}): Promise<MemberListResult> {
  await requireUser();

  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 10));

  const where: {
    OR?: (
      | { name: { contains: string; mode: "insensitive" } }
      | { email: { contains: string; mode: "insensitive" } }
      | { nomorInduk: { contains: string; mode: "insensitive" } }
    )[];
    status?: MemberStatus;
    kelas?: string;
  } = {};

  if (query.search) {
    const search = query.search.trim();
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { nomorInduk: { contains: search, mode: "insensitive" } },
    ];
  }
  if (query.filterStatus && query.filterStatus !== "ALL") {
    where.status = query.filterStatus as MemberStatus;
  }
  if (query.filterKelas && query.filterKelas !== "ALL") {
    where.kelas = query.filterKelas;
  }

  const orderBy: Record<string, "asc" | "desc">[] = [];
  switch (query.sort) {
    case "name_desc":
      orderBy.push({ name: "desc" });
      break;
    case "email":
      orderBy.push({ email: "asc" });
      break;
    case "join_date":
      orderBy.push({ joinDate: "desc" });
      break;
    case "name":
    default:
      orderBy.push({ name: "asc" });
  }

  const [total, rows] = await Promise.all([
    prisma.member.count({ where }),
    prisma.member.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        sekbids: { include: { sekbid: true } },
        positions: { include: { position: true } },
      },
    }),
  ]);

  return {
    data: rows.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      phone: m.phone,
      kelas: m.kelas,
      jurusan: m.jurusan,
      nomorInduk: m.nomorInduk,
      status: m.status as MemberStatus,
      joinDate: m.joinDate?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
      sekbids: m.sekbids.map((s) => ({ id: s.sekbid.id, name: s.sekbid.name })),
      positions: m.positions.map((p) => ({ id: p.position.id, name: p.position.name })),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getMemberAction(id: string): Promise<GetMemberResult> {
  await requireUser();

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      sekbids: { include: { sekbid: true } },
      positions: { include: { position: true } },
    },
  });
  if (!member) return { error: "Anggota tidak ditemukan." };

  return {
    ok: true,
    data: {
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      kelas: member.kelas,
      jurusan: member.jurusan,
      nomorInduk: member.nomorInduk,
      status: member.status as MemberStatus,
      joinDate: member.joinDate?.toISOString() ?? null,
      createdAt: member.createdAt.toISOString(),
      sekbids: member.sekbids.map((s) => ({ id: s.sekbid.id, name: s.sekbid.name })),
      positions: member.positions.map((p) => ({ id: p.position.id, name: p.position.name })),
    },
  };
}

export async function createMemberAction(input: MemberInput): Promise<MemberActionResult> {
  const session = await requirePermission("manage_members");

  const name = input.name.trim();
  if (!name) return { error: "Nama wajib diisi." };

  if (input.nomorInduk) {
    const existing = await prisma.member.findUnique({
      where: { nomorInduk: input.nomorInduk },
    });
    if (existing) return { error: "Nomor induk sudah dipakai." };
  }

  const member = await prisma.member.create({
    data: {
      name,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      kelas: input.kelas || null,
      jurusan: input.jurusan || null,
      nomorInduk: input.nomorInduk || null,
      status: input.status ?? "AKTIF",
      joinDate: input.joinDate ? new Date(input.joinDate) : null,
      sekbids: input.sekbidIds?.length
        ? { create: input.sekbidIds.map((sekbidId) => ({ sekbidId })) }
        : undefined,
      positions: input.positionIds?.length
        ? { create: input.positionIds.map((positionId) => ({ positionId })) }
        : undefined,
    },
  });

  await createActivityLog(session.id, "CREATE", "MEMBER", member.id, `Membuat anggota ${name}`);
  return { ok: true, id: member.id };
}

export async function updateMemberAction(
  id: string,
  input: MemberInput
): Promise<MemberActionResult> {
  const session = await requirePermission("manage_members");

  const existing = await prisma.member.findUnique({
    where: { id },
    include: { sekbids: true, positions: true },
  });
  if (!existing) return { error: "Anggota tidak ditemukan." };

  const name = input.name.trim();
  if (!name) return { error: "Nama wajib diisi." };

  if (input.nomorInduk) {
    const dup = await prisma.member.findFirst({
      where: { nomorInduk: input.nomorInduk, NOT: { id } },
    });
    if (dup) return { error: "Nomor induk sudah dipakai." };
  }

  const sekbidIds = input.sekbidIds ?? existing.sekbids.map((s) => s.sekbidId);
  const positionIds = input.positionIds ?? existing.positions.map((p) => p.positionId);

  const member = await prisma.member.update({
    where: { id },
    data: {
      name,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      kelas: input.kelas || null,
      jurusan: input.jurusan || null,
      nomorInduk: input.nomorInduk || null,
      status: input.status ?? existing.status,
      joinDate: input.joinDate ? new Date(input.joinDate) : null,
      sekbids: { deleteMany: {}, create: sekbidIds.map((sekbidId) => ({ sekbidId })) },
      positions: { deleteMany: {}, create: positionIds.map((positionId) => ({ positionId })) },
    },
  });

  await createActivityLog(session.id, "UPDATE", "MEMBER", member.id, `Mengubah anggota ${name}`);
  return { ok: true, id: member.id };
}

export async function deleteMemberAction(id: string): Promise<{ ok: true } | { error: string }> {
  const session = await requirePermission("manage_members");

  const existing = await prisma.member.findUnique({ where: { id } });
  if (!existing) return { error: "Anggota tidak ditemukan." };

  await prisma.member.delete({ where: { id } });
  await createActivityLog(session.id, "DELETE", "MEMBER", id, `Menghapus anggota ${existing.name}`);
  return { ok: true };
}

export async function toggleMemberStatusAction(
  id: string
): Promise<{ ok: true; status: MemberStatus } | { error: string }> {
  const session = await requirePermission("manage_members");

  const existing = await prisma.member.findUnique({ where: { id } });
  if (!existing) return { error: "Anggota tidak ditemukan." };

  const nextStatus: MemberStatus =
    existing.status === "AKTIF" ? "TIDAK_AKTIF" : "AKTIF";

  await prisma.member.update({ where: { id }, data: { status: nextStatus } });
  await createActivityLog(
    session.id,
    "TOGGLE_STATUS",
    "MEMBER",
    id,
    `Status anggota ${existing.name} diubah menjadi ${nextStatus}`
  );
  return { ok: true, status: nextStatus };
}

export async function listKelasAction(): Promise<string[]> {
  await requireUser();
  const rows = await prisma.member.findMany({
    where: { kelas: { not: null } },
    distinct: ["kelas"],
    select: { kelas: true },
    orderBy: { kelas: "asc" },
  });
  return rows.map((r) => r.kelas as string);
}

export async function getMyMemberAction(): Promise<{ id: string } | null> {
  const session = await requireUser();
  const member = await prisma.member.findUnique({
    where: { userId: session.id },
    select: { id: true },
  });
  return member ? { id: member.id } : null;
}

export async function listAllMembersAction(): Promise<MemberListItem[]> {
  await requireUser();

  const rows = await prisma.member.findMany({
    orderBy: { name: "asc" },
    include: {
      sekbids: { include: { sekbid: true } },
      positions: { include: { position: true } },
    },
  });

  return rows.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    kelas: m.kelas,
    jurusan: m.jurusan,
    nomorInduk: m.nomorInduk,
    status: m.status as MemberStatus,
    joinDate: m.joinDate?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
    sekbids: m.sekbids.map((s) => ({ id: s.sekbid.id, name: s.sekbid.name })),
    positions: m.positions.map((p) => ({ id: p.position.id, name: p.position.name })),
  }));
}

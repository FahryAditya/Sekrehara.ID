"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import type { Role } from "./generated/prisma/enums";

export type AdminUserItem = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
};

export type AdminUserInput = {
  name: string;
  email: string;
  password: string;
  role: Role;
};

export type AdminUserActionResult = { ok: true; id: string } | { error: string };

export async function listUsersAction(): Promise<AdminUserItem[]> {
  const session = await requireSuperAdmin().catch(() => null);
  if (!session) return [];

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  }));
}

export async function createUserAction(input: AdminUserInput): Promise<AdminUserActionResult> {
  const session = await requireSuperAdmin();

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name) return { error: "Nama lengkap wajib diisi." };
  if (!email) return { error: "Alamat email wajib diisi." };
  if (!input.password || input.password.length < 6) {
    return { error: "Password minimal 6 karakter." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Email tersebut sudah terdaftar sebagai pengguna." };

  const hashedPassword = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: input.role,
    },
  });

  await createActivityLog(session.id, "CREATE", "USER", user.id, `Membuat pengguna ${email}`);
  return { ok: true, id: user.id };
}

export async function deleteUserAction(id: string): Promise<{ ok: true } | { error: string }> {
  const session = await requireSuperAdmin();

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: "Pengguna tidak ditemukan." };
  if (target.id === session.id) return { error: "Anda tidak dapat menghapus akun sendiri." };

  await prisma.user.delete({ where: { id } });
  await createActivityLog(session.id, "DELETE", "USER", id, `Menghapus pengguna ${target.email}`);
  return { ok: true };
}

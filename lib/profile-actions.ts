"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import bcrypt from "bcryptjs";

export type ProfileResult = { ok: true; data: ProfileData } | { error: string };

export type ProfileData = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: string;
  avatarUrl: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  address: string | null;
  createdAt: string;
};

export type UpdateProfileInput = {
  name: string;
  username?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
};

export async function getProfileAction(): Promise<ProfileResult> {
  const session = await requireUser();
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return { error: "Pengguna tidak ditemukan." };

  return {
    ok: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth?.toISOString() ?? null,
      address: user.address,
      createdAt: user.createdAt.toISOString(),
    },
  };
}

export async function updateProfileAction(input: UpdateProfileInput): Promise<ProfileResult> {
  const session = await requireUser();
  const name = input.name.trim();
  if (!name) return { error: "Nama wajib diisi." };

  const username = input.username?.trim() || null;
  if (username) {
    const existing = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" }, NOT: { id: session.id } },
    });
    if (existing) return { error: "Username sudah dipakai." };
  }

  const user = await prisma.user.update({
    where: { id: session.id },
    data: {
      name,
      username,
      phone: input.phone?.trim() || null,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      address: input.address?.trim() || null,
    },
  });

  await createActivityLog(session.id, "UPDATE_PROFILE", "USER", user.id, "Profil diperbarui");

  return {
    ok: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth?.toISOString() ?? null,
      address: user.address,
      createdAt: user.createdAt.toISOString(),
    },
  };
}

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePasswordResult = { ok: true } | { error: string };

export async function changePasswordAction(
  input: ChangePasswordInput
): Promise<ChangePasswordResult> {
  const session = await requireUser();

  if (input.newPassword.length < 6) {
    return { error: "Password baru minimal 6 karakter." };
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return { error: "Pengguna tidak ditemukan." };

  const passwordValid = await bcrypt.compare(input.currentPassword, user.password);
  if (!passwordValid) return { error: "Password lama salah." };

  const hashedPassword = await bcrypt.hash(input.newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  await createActivityLog(user.id, "CHANGE_PASSWORD", "USER", user.id, "Password diubah");

  return { ok: true };
}

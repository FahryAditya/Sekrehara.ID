"use server";

import { prisma } from "@/lib/prisma";
import { createSession, destroySession, getSession, type SessionUser } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { createActivityLog } from "@/lib/activity-log";

export type LoginActionResult = { user: SessionUser } | { error: string };

export type RegisterActionResult = { ok: true } | { error: string };

export async function loginAction(
  email: string,
  password: string,
  rememberMe = false
): Promise<LoginActionResult> {
  const user = await prisma.user.findFirst({
    where: {
      email: { equals: email.trim(), mode: "insensitive" },
    },
  });

  if (!user) {
    return { error: "Email atau password salah." };
  }

  if (!user.isActive) {
    return { error: "Akun Anda dinonaktifkan. Hubungi administrator." };
  }

  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) {
    return { error: "Email atau password salah." };
  }

  await createSession(user.id, rememberMe);
  await createActivityLog(user.id, "LOGIN", "USER", user.id, "Pengguna masuk");

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as SessionUser["role"],
      createdAt: user.createdAt.toISOString(),
    },
  };
}

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export async function registerAction(input: RegisterInput): Promise<RegisterActionResult> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();

  if (!name || !email || !input.password) {
    return { error: "Semua kolom wajib diisi." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Format email tidak valid." };
  }

  if (input.password.length < 6) {
    return { error: "Password minimal 6 karakter." };
  }

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (existing) {
    return { error: "Email sudah terdaftar." };
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role: "ADMIN" },
  });

  await createActivityLog(user.id, "REGISTER", "USER", user.id, "Registrasi akun baru");

  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  if (session) {
    await createActivityLog(session.id, "LOGOUT", "USER", session.id, "Pengguna keluar");
  }
  await destroySession();
}

export async function getSessionAction(): Promise<SessionUser | null> {
  return getSession();
}

export type ForgotPasswordResult = { ok: true } | { error: string };

export async function forgotPasswordAction(email: string): Promise<ForgotPasswordResult> {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email.trim(), mode: "insensitive" } },
  });

  if (!user) {
    return { ok: true };
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordReset.create({
    data: { userId: user.id, token, expiresAt },
  });

  await createActivityLog(user.id, "FORGOT_PASSWORD", "USER", user.id, "Permintaan reset password");

  return { ok: true };
}

export type ResetPasswordResult = { ok: true } | { error: string };

export async function resetPasswordAction(
  token: string,
  password: string
): Promise<ResetPasswordResult> {
  if (!token || password.length < 6) {
    return { error: "Token atau password tidak valid." };
  }

  const reset = await prisma.passwordReset.findUnique({ where: { token } });
  if (!reset || reset.expiresAt < new Date()) {
    return { error: "Token tidak valid atau sudah kedaluwarsa." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: reset.userId },
    data: { password: hashedPassword },
  });

  await prisma.passwordReset.deleteMany({ where: { userId: reset.userId } });
  await createActivityLog(reset.userId, "RESET_PASSWORD", "USER", reset.userId, "Password direset");

  return { ok: true };
}

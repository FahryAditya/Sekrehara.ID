"use server";

import { prisma } from "@/lib/prisma";
import { createSession, destroySession, getSession, type SessionUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export type LoginActionResult = { user: SessionUser } | { error: string };

export async function loginAction(email: string, password: string): Promise<LoginActionResult> {
  const user = await prisma.user.findFirst({
    where: {
      email: { equals: email.trim(), mode: "insensitive" },
    },
  });

  if (!user) {
    return { error: "Email atau password salah." };
  }

  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) {
    return { error: "Email atau password salah." };
  }

  await createSession(user.id);

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

export async function logoutAction(): Promise<void> {
  await destroySession();
}

export async function getSessionAction(): Promise<SessionUser | null> {
  return getSession();
}

import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/types";

const SESSION_COOKIE = "sekrehara_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const SESSION_REMEMBER_TTL_SECONDS = 60 * 60 * 24 * 30;
const SESSION_SECRET = process.env.SESSION_SECRET ?? "sekrehara-session-secret";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};

function signPayload(payload: string): string {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
}

function createToken(userId: string, ttlSeconds = SESSION_TTL_SECONDS): string {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${signPayload(payload)}`;
}

function readUserId(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresAt, signature] = parts;
  const payload = `${userId}.${expiresAt}`;
  const expected = Buffer.from(signPayload(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }
  if (Number(expiresAt) < Date.now()) return null;
  return userId ?? null;
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const userId = readUserId(cookieStore.get(SESSION_COOKIE)?.value);
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    createdAt: user.createdAt.toISOString(),
  };
});

export async function createSession(userId: string, rememberMe = false): Promise<void> {
  const cookieStore = await cookies();
  const ttl = rememberMe ? SESSION_REMEMBER_TTL_SECONDS : SESSION_TTL_SECONDS;
  cookieStore.set(SESSION_COOKIE, createToken(userId, ttl), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ttl,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

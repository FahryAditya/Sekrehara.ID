"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/permissions";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationInput = {
  type: string;
  title: string;
  message?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
};

export async function createNotification(
  userId: string,
  input: NotificationInput
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: input.type,
        title: input.title,
        message: input.message ?? null,
        relatedEntityType: input.relatedEntityType ?? null,
        relatedEntityId: input.relatedEntityId ?? null,
      },
    });
  } catch {
    // Abaikan kegagalan notifikasi agar tidak mengganggu operasi utama
  }
}

export async function listNotificationsAction(
  limit = 10,
  unreadOnly = false
): Promise<NotificationItem[]> {
  const session = await requireUser();
  const rows = await prisma.notification.findMany({
    where: { userId: session.id, ...(unreadOnly ? { isRead: false } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    relatedEntityType: n.relatedEntityType,
    relatedEntityId: n.relatedEntityId,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }));
}

export async function getUnreadCountAction(): Promise<number> {
  const session = await requireUser();
  return prisma.notification.count({
    where: { userId: session.id, isRead: false },
  });
}

export async function markNotificationReadAction(id: string): Promise<{ ok: true }> {
  const session = await requireUser();
  await prisma.notification.updateMany({
    where: { id, userId: session.id },
    data: { isRead: true },
  });
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<{ ok: true }> {
  const session = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: session.id, isRead: false },
    data: { isRead: true },
  });
  return { ok: true };
}

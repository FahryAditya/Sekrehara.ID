"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";

export type AnnouncementItem = {
  id: string;
  subject: string;
  body: string;
  recipientCount: number;
  sentAt: string;
};

export type AnnouncementInput = {
  subject: string;
  body: string;
  recipientCount: number;
};

export type AnnouncementActionResult = { ok: true; id: string } | { error: string };

export async function listAnnouncementsAction(): Promise<AnnouncementItem[]> {
  await requireUser();

  const announcements = await prisma.announcement.findMany({
    orderBy: { sentAt: "desc" },
  });

  return announcements.map((announcement) => ({
    id: announcement.id,
    subject: announcement.subject,
    body: announcement.body,
    recipientCount: announcement.recipientCount,
    sentAt: announcement.sentAt.toISOString(),
  }));
}

export async function createAnnouncementAction(
  input: AnnouncementInput
): Promise<AnnouncementActionResult> {
  const session = await requirePermission("manage_members");

  const subject = input.subject.trim();
  const body = input.body.trim();
  if (!subject) return { error: "Subjek pengumuman wajib diisi." };
  if (!body) return { error: "Isi pengumuman wajib diisi." };

  const announcement = await prisma.announcement.create({
    data: {
      subject,
      body,
      recipientCount: input.recipientCount,
      createdById: session.id,
    },
  });

  await createActivityLog(
    session.id,
    "CREATE",
    "ANNOUNCEMENT",
    announcement.id,
    `Mengirim pengumuman ${subject} ke ${input.recipientCount} penerima`
  );

  return { ok: true, id: announcement.id };
}

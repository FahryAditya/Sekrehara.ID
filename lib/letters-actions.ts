"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import { createNotification } from "@/lib/notifications-actions";
import type { LetterType, LetterStatus } from "./generated/prisma/enums";

export type LetterItem = {
  id: string;
  letterType: LetterType;
  letterNumber: string | null;
  date: string;
  subject: string;
  sender: string | null;
  recipient: string | null;
  fileUrl: string | null;
  status: LetterStatus;
  rejectionReason: string | null;
};

export type LetterInput = {
  letterType: LetterType;
  date: string;
  subject: string;
  sender?: string | null;
  recipient?: string | null;
  fileUrl?: string | null;
  status?: LetterStatus;
  letterNumber?: string | null;
};

export type LetterActionResult = { ok: true; id: string; letterNumber?: string } | { error: string };

export type LetterListQuery = {
  page?: number;
  pageSize?: number;
  letterType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
};

export type LetterListResult = {
  data: LetterItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listLettersAction(query: LetterListQuery = {}): Promise<LetterListResult> {
  await requireUser();

  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 10));

  const where: {
    letterType?: LetterType;
    status?: LetterStatus;
    date?: { gte?: Date; lte?: Date };
    OR?: (
      | { letterNumber: { contains: string; mode: "insensitive" } }
      | { subject: { contains: string; mode: "insensitive" } }
      | { sender: { contains: string; mode: "insensitive" } }
    )[];
  } = {};

  if (query.letterType && query.letterType !== "ALL") {
    where.letterType = query.letterType as LetterType;
  }
  if (query.status && query.status !== "ALL") {
    where.status = query.status as LetterStatus;
  }
  if (query.dateFrom || query.dateTo) {
    where.date = {};
    if (query.dateFrom) where.date.gte = new Date(query.dateFrom);
    if (query.dateTo) where.date.lte = new Date(query.dateTo);
  }
  if (query.search) {
    const search = query.search.trim();
    where.OR = [
      { letterNumber: { contains: search, mode: "insensitive" } },
      { subject: { contains: search, mode: "insensitive" } },
      { sender: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.letter.count({ where }),
    prisma.letter.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    data: rows.map((l) => ({
      id: l.id,
      letterType: l.letterType as LetterType,
      letterNumber: l.letterNumber,
      date: l.date.toISOString(),
      subject: l.subject,
      sender: l.sender,
      recipient: l.recipient,
      fileUrl: l.fileUrl,
      status: l.status as LetterStatus,
      rejectionReason: l.rejectionReason,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getLetterAction(id: string): Promise<LetterItem | null> {
  await requireUser();
  const letter = await prisma.letter.findUnique({ where: { id } });
  if (!letter) return null;

  return {
    id: letter.id,
    letterType: letter.letterType as LetterType,
    letterNumber: letter.letterNumber,
    date: letter.date.toISOString(),
    subject: letter.subject,
    sender: letter.sender,
    recipient: letter.recipient,
    fileUrl: letter.fileUrl,
    status: letter.status as LetterStatus,
    rejectionReason: letter.rejectionReason,
  };
}

export async function generateLetterNumber(letterType: LetterType): Promise<string> {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const typeCode = letterType === "MASUK" ? "MASUK" : "KELUAR";

  const count = await prisma.letter.count({
    where: {
      letterType,
      letterNumber: { contains: `/${typeCode}/OSIS/${month}/${year}` },
    },
  });

  const next = count + 1;
  return `${String(next).padStart(3, "0")}/${typeCode}/OSIS/${month}/${year}`;
}

export async function createLetterAction(input: LetterInput): Promise<LetterActionResult> {
  const session = await requirePermission("manage_letters");
  const subject = input.subject.trim();
  if (!subject) return { error: "Perihal surat wajib diisi." };
  if (!input.date) return { error: "Tanggal surat wajib diisi." };

  const letterNumber = input.letterNumber || (await generateLetterNumber(input.letterType));

  const existing = await prisma.letter.findUnique({ where: { letterNumber } });
  if (existing) return { error: "Nomor surat sudah dipakai." };

  const letter = await prisma.letter.create({
    data: {
      letterType: input.letterType,
      letterNumber,
      date: new Date(input.date),
      subject,
      sender: input.sender?.trim() || null,
      recipient: input.recipient?.trim() || null,
      fileUrl: input.fileUrl?.trim() || null,
      status: input.status ?? "DRAFT",
      createdById: session.id,
    },
  });

  await createActivityLog(session.id, "CREATE", "LETTER", letter.id, `Membuat surat ${letterNumber}`);
  return { ok: true, id: letter.id, letterNumber };
}

export async function updateLetterAction(
  id: string,
  input: LetterInput
): Promise<LetterActionResult> {
  const session = await requirePermission("manage_letters");
  const existing = await prisma.letter.findUnique({ where: { id } });
  if (!existing) return { error: "Surat tidak ditemukan." };

  const subject = input.subject.trim();
  if (!subject) return { error: "Perihal surat wajib diisi." };

  const letterNumber = input.letterNumber || existing.letterNumber;
  if (letterNumber) {
    const dup = await prisma.letter.findFirst({
      where: { letterNumber, NOT: { id } },
    });
    if (dup) return { error: "Nomor surat sudah dipakai." };
  }

  await prisma.letter.update({
    where: { id },
    data: {
      letterType: input.letterType,
      letterNumber,
      date: new Date(input.date),
      subject,
      sender: input.sender?.trim() || null,
      recipient: input.recipient?.trim() || null,
      fileUrl: input.fileUrl?.trim() || null,
      status: input.status ?? existing.status,
    },
  });

  await createActivityLog(session.id, "UPDATE", "LETTER", id, `Mengubah surat ${letterNumber}`);
  return { ok: true, id, letterNumber: letterNumber ?? undefined };
}

export async function deleteLetterAction(id: string): Promise<{ ok: true } | { error: string }> {
  const session = await requirePermission("manage_letters");
  const existing = await prisma.letter.findUnique({ where: { id } });
  if (!existing) return { error: "Surat tidak ditemukan." };

  await prisma.letter.delete({ where: { id } });
  await createActivityLog(
    session.id,
    "DELETE",
    "LETTER",
    id,
    `Menghapus surat ${existing.letterNumber ?? existing.subject}`
  );
  return { ok: true };
}

export async function approveLetterAction(
  id: string,
  letterNumber?: string
): Promise<{ ok: true; letterNumber?: string } | { error: string }> {
  const session = await requirePermission("approve_document");
  const existing = await prisma.letter.findUnique({ where: { id } });
  if (!existing) return { error: "Surat tidak ditemukan." };

  let finalNumber = existing.letterNumber;
  if (existing.status === "DRAFT" && letterNumber) {
    const dup = await prisma.letter.findFirst({
      where: { letterNumber, NOT: { id } },
    });
    if (dup) return { error: "Nomor surat sudah dipakai." };
    finalNumber = letterNumber;
  }

  await prisma.letter.update({
    where: { id },
    data: {
      status: "APPROVED",
      letterNumber: finalNumber,
      reviewedById: session.id,
      reviewedAt: new Date(),
    },
  });

  await createActivityLog(
    session.id,
    "APPROVE",
    "LETTER",
    id,
    `Menyetujui surat ${finalNumber ?? existing.subject}`
  );

  return { ok: true, letterNumber: finalNumber ?? undefined };
}

export async function rejectLetterAction(
  id: string,
  reason: string
): Promise<{ ok: true } | { error: string }> {
  const session = await requirePermission("approve_document");
  const existing = await prisma.letter.findUnique({ where: { id } });
  if (!existing) return { error: "Surat tidak ditemukan." };

  if (!reason.trim()) return { error: "Alasan penolakan wajib diisi." };

  await prisma.letter.update({
    where: { id },
    data: {
      status: "REJECTED",
      rejectionReason: reason.trim(),
      reviewedById: session.id,
      reviewedAt: new Date(),
    },
  });

  if (existing.createdById) {
    await createNotification(existing.createdById, {
      type: "LETTER_REJECTED",
      title: "Surat ditolak",
      message: existing.subject,
      relatedEntityType: "LETTER",
      relatedEntityId: id,
    });
  }

  await createActivityLog(session.id, "REJECT", "LETTER", id, `Menolak surat ${existing.subject}`);
  return { ok: true };
}

export async function archiveLetterAction(
  id: string
): Promise<{ ok: true } | { error: string }> {
  const session = await requirePermission("manage_letters");
  const existing = await prisma.letter.findUnique({ where: { id } });
  if (!existing) return { error: "Surat tidak ditemukan." };

  await prisma.letter.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });

  await createActivityLog(session.id, "ARCHIVE", "LETTER", id, `Mengarsipkan surat ${existing.subject}`);
  return { ok: true };
}

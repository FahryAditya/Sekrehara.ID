"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission, requireUser } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import type { TransactionType } from "./generated/prisma/enums";

export type TransactionItem = {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
};

export type TransactionInput = {
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  date: string;
};

export type TransactionActionResult = { ok: true; id: string } | { error: string };

export async function listTransactionsAction(): Promise<TransactionItem[]> {
  await requireUser();

  const transactions = await prisma.transaction.findMany({
    orderBy: { date: "desc" },
  });

  return transactions.map((transaction) => ({
    id: transaction.id,
    type: transaction.type as TransactionType,
    category: transaction.category,
    amount: transaction.amount,
    description: transaction.description,
    date: transaction.date.toISOString(),
    createdAt: transaction.createdAt.toISOString(),
  }));
}

export async function createTransactionAction(
  input: TransactionInput
): Promise<TransactionActionResult> {
  const session = await requirePermission("manage_finance");

  if (!input.description.trim()) return { error: "Keterangan wajib diisi." };
  if (!input.category.trim()) return { error: "Kategori wajib diisi." };
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { error: "Jumlah harus berupa angka lebih dari 0." };
  }
  if (!input.date) return { error: "Tanggal transaksi wajib diisi." };

  const transaction = await prisma.transaction.create({
    data: {
      type: input.type,
      category: input.category.trim(),
      amount: input.amount,
      description: input.description.trim(),
      date: new Date(input.date),
      createdById: session.id,
    },
  });

  await createActivityLog(
    session.id,
    "CREATE",
    "TRANSACTION",
    transaction.id,
    `${input.type === "PEMASUKAN" ? "Mencatat pemasukan" : "Mencatat pengeluaran"} ${input.description}`
  );

  return { ok: true, id: transaction.id };
}

export async function deleteTransactionAction(
  id: string
): Promise<{ ok: true } | { error: string }> {
  const session = await requirePermission("manage_finance");

  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing) return { error: "Transaksi tidak ditemukan." };

  await prisma.transaction.delete({ where: { id } });
  await createActivityLog(
    session.id,
    "DELETE",
    "TRANSACTION",
    id,
    `Menghapus transaksi ${existing.description}`
  );

  return { ok: true };
}

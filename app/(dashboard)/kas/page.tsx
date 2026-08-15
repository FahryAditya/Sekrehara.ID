"use client";

import { useMemo, useState } from "react";
import { useDataStore } from "@/lib/data-store";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/layout/stat-card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SearchInput } from "@/components/ui/search-input";
import { Table } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { TransactionForm } from "@/components/feature/transaction-form";
import { PlusIcon, WalletIcon, TrendingUpIcon, TrendingDownIcon, TrashIcon } from "@/components/ui/icons";
import { formatRupiah, formatDate } from "@/lib/format";
import { combineClassNames } from "@/lib/utils";
import type { Transaction, TransactionType } from "@/lib/types";

type TransactionFilter = "SEMUA" | TransactionType;

export default function KasPage() {
  const { transactions, addTransaction, deleteTransaction } = useDataStore();
  const { showSuccess } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TransactionFilter>("SEMUA");
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const totalPemasukan = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.type === "PEMASUKAN")
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    [transactions]
  );

  const totalPengeluaran = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.type === "PENGELUARAN")
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    [transactions]
  );

  const saldoAkhir = totalPemasukan - totalPengeluaran;

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const matchedTransactions = transactions
      .filter((transaction) => {
        const matchesType = typeFilter === "SEMUA" || transaction.type === typeFilter;
        const matchesQuery =
          !normalizedQuery ||
          transaction.description.toLowerCase().includes(normalizedQuery) ||
          transaction.category.toLowerCase().includes(normalizedQuery);
        return matchesType && matchesQuery;
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    const rowsWithBalance = matchedTransactions
      .slice()
      .reverse()
      .reduce<Array<{ transaction: Transaction; runningBalance: number }>>(
        (accumulator, transaction) => {
          const previousBalance =
            accumulator.length === 0 ? 0 : accumulator[accumulator.length - 1].runningBalance;
          const runningBalance =
            transaction.type === "PEMASUKAN"
              ? previousBalance + transaction.amount
              : previousBalance - transaction.amount;
          return [...accumulator, { transaction, runningBalance }];
        },
        []
      )
      .reverse();

    return rowsWithBalance;
  }, [transactions, searchQuery, typeFilter]);

  const handleSubmitTransaction = (values: {
    type: TransactionType;
    category: string;
    amount: number;
    description: string;
    date: string;
  }) => {
    addTransaction(values);
    showSuccess(
      values.type === "PEMASUKAN" ? "Pemasukan berhasil dicatat." : "Pengeluaran berhasil dicatat."
    );
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!transactionToDelete) return;

    setIsDeleting(true);
    deleteTransaction(transactionToDelete.id);
    showSuccess("Transaksi berhasil dihapus.");
    setIsDeleting(false);
    setTransactionToDelete(null);
  };

  return (
    <div>
      <PageHeader
        title="Buku Kas"
        description="Catat pemasukan dan pengeluaran organisasi secara transparan."
        action={
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Catat Transaksi
          </Button>
        }
      />

      <section
        aria-label="Ringkasan saldo"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <StatCard
          label="Saldo Akhir"
          value={formatRupiah(saldoAkhir)}
          numericValue={saldoAkhir}
          animateValue
          formatValue={(num) => formatRupiah(num)}
          icon={<WalletIcon className="h-5 w-5" />}
          accentClassName="bg-primary-soft text-primary"
        />
        <StatCard
          label="Total Pemasukan"
          value={formatRupiah(totalPemasukan)}
          numericValue={totalPemasukan}
          animateValue
          formatValue={(num) => formatRupiah(num)}
          icon={<TrendingUpIcon className="h-5 w-5" />}
          accentClassName="bg-success-soft text-success"
        />
        <StatCard
          label="Total Pengeluaran"
          value={formatRupiah(totalPengeluaran)}
          numericValue={totalPengeluaran}
          animateValue
          formatValue={(num) => formatRupiah(num)}
          icon={<TrendingDownIcon className="h-5 w-5" />}
          accentClassName="bg-danger-soft text-danger"
        />
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-sm">
          <SearchInput
            id="transaction-search"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Cari keterangan atau kategori..."
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterButton
            label="Semua"
            isActive={typeFilter === "SEMUA"}
            onClick={() => setTypeFilter("SEMUA")}
          />
          <FilterButton
            label="Pemasukan"
            isActive={typeFilter === "PEMASUKAN"}
            onClick={() => setTypeFilter("PEMASUKAN")}
          />
          <FilterButton
            label="Pengeluaran"
            isActive={typeFilter === "PENGELUARAN"}
            onClick={() => setTypeFilter("PENGELUARAN")}
          />
        </div>
      </div>

      <Card className="mt-5">
        {filteredTransactions.length > 0 ? (
          <Table
            columns={[
              {
                header: "Tanggal",
                accessor: ({ transaction }: { transaction: Transaction }) =>
                  formatDate(transaction.date),
              },
              {
                header: "Keterangan",
                accessor: ({ transaction }: { transaction: Transaction }) => (
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{transaction.description}</span>
                    <span className="text-xs text-muted">{transaction.category}</span>
                  </div>
                ),
              },
              {
                header: "Jenis",
                accessor: ({ transaction }: { transaction: Transaction }) => (
                  <Badge
                    variant={transaction.type === "PEMASUKAN" ? "success" : "danger"}
                  >
                    {transaction.type === "PEMASUKAN" ? "Masuk" : "Keluar"}
                  </Badge>
                ),
              },
              {
                header: "Jumlah",
                accessor: ({ transaction }: { transaction: Transaction }) => (
                  <span
                    className={combineClassNames(
                      "font-medium",
                      transaction.type === "PEMASUKAN" ? "text-success" : "text-danger"
                    )}
                  >
                    {transaction.type === "PEMASUKAN" ? "+" : "−"}
                    {formatRupiah(transaction.amount)}
                  </span>
                ),
              },
              {
                header: "Saldo Berjalan",
                accessor: ({ runningBalance }: { runningBalance: number }) => (
                  <span className="text-muted">{formatRupiah(runningBalance)}</span>
                ),
              },
              {
                header: "Aksi",
                accessor: ({ transaction }: { transaction: Transaction }) => (
                  <Button
                    variant="ghost"
                    size="small"
                    aria-label={`Hapus transaksi ${transaction.description}`}
                    className="text-danger hover:bg-danger-soft hover:text-danger"
                    onClick={() => setTransactionToDelete(transaction)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                ),
              },
            ]}
            data={filteredTransactions}
            rowKey={({ transaction }) => transaction.id}
          />
        ) : (
          <EmptyState
            icon={<WalletIcon className="h-6 w-6" />}
            title={searchQuery || typeFilter !== "SEMUA" ? "Tidak ada hasil" : "Belum ada transaksi"}
            description={
              searchQuery || typeFilter !== "SEMUA"
                ? "Coba ubah kata kunci atau filter transaksi."
                : "Catat transaksi pertama untuk mulai mengelola arus kas."
            }
            action={
              !searchQuery && typeFilter === "SEMUA" ? (
                <Button onClick={() => setIsModalOpen(true)}>
                  <PlusIcon className="h-4 w-4" />
                  Catat Transaksi
                </Button>
              ) : undefined
            }
          />
        )}
      </Card>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Catat Transaksi"
        description="Catat pemasukan atau pengeluaran baru ke buku kas."
      >
        <TransactionForm
          submitLabel="Simpan Transaksi"
          onSubmit={handleSubmitTransaction}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={transactionToDelete !== null}
        title="Hapus Transaksi"
        message={
          transactionToDelete
            ? `Anda yakin ingin menghapus transaksi "${transactionToDelete.description}" senilai ${formatRupiah(
                transactionToDelete.amount
              )}? Saldo kas akan dihitung ulang.`
            : ""
        }
        confirmLabel="Hapus Transaksi"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTransactionToDelete(null)}
      />
    </div>
  );
}

function FilterButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={combineClassNames(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        isActive ? "bg-primary text-white" : "bg-surface text-muted hover:bg-background"
      )}
    >
      {label}
    </button>
  );
}
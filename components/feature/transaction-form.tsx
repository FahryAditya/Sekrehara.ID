"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { TransactionType } from "@/lib/types";

const incomeCategories = ["Iuran", "Donasi", "Sponsor", "Lainnya"];
const expenseCategories = ["Konsumsi", "Operasional", "Transportasi", "Lainnya"];

type TransactionFormProps = {
  submitLabel: string;
  onSubmit: (values: {
    type: TransactionType;
    category: string;
    amount: number;
    description: string;
    date: string;
  }) => void;
  onCancel: () => void;
};

type FieldErrors = {
  type?: string;
  category?: string;
  amount?: string;
  date?: string;
};

export function TransactionForm({ submitLabel, onSubmit, onCancel }: TransactionFormProps) {
  const { showError } = useToast();
  const [type, setType] = useState<TransactionType>("PEMASUKAN");
  const [category, setCategory] = useState(incomeCategories[0]);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    setCategory(nextType === "PEMASUKAN" ? incomeCategories[0] : expenseCategories[0]);
  };

  const availableCategories = type === "PEMASUKAN" ? incomeCategories : expenseCategories;

  const validateForm = (): boolean => {
    const nextErrors: FieldErrors = {};

    if (!amount.trim()) {
      nextErrors.amount = "Jumlah wajib diisi.";
    } else {
      const numericAmount = Number(amount);
      if (Number.isNaN(numericAmount) || numericAmount <= 0) {
        nextErrors.amount = "Jumlah harus berupa angka lebih dari 0.";
      }
    }

    if (!date) {
      nextErrors.date = "Tanggal transaksi wajib diisi.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      showError("Periksa kembali isian formulir.");
      return;
    }

    onSubmit({
      type,
      category,
      amount: Number(amount),
      description: description.trim(),
      date: new Date(date).toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">Jenis Transaksi</legend>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleTypeChange("PEMASUKAN")}
            aria-pressed={type === "PEMASUKAN"}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
              type === "PEMASUKAN"
                ? "border-success bg-success-soft text-success"
                : "border-border bg-surface text-muted hover:bg-background"
            }`}
          >
            Pemasukan
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("PENGELUARAN")}
            aria-pressed={type === "PENGELUARAN"}
            className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
              type === "PENGELUARAN"
                ? "border-danger bg-danger-soft text-danger"
                : "border-border bg-surface text-muted hover:bg-background"
            }`}
          >
            Pengeluaran
          </button>
        </div>
      </fieldset>

      <Select
        id="transaction-category"
        label="Kategori"
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        error={fieldErrors.category}
      >
        {availableCategories.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </Select>

      <Input
        id="transaction-amount"
        label="Jumlah (Rupiah)"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        error={fieldErrors.amount}
        placeholder="mis. 500000"
        inputMode="numeric"
      />

      <Input
        id="transaction-date"
        label="Tanggal Transaksi"
        type="date"
        value={date}
        onChange={(event) => setDate(event.target.value)}
        error={fieldErrors.date}
      />

      <Textarea
        id="transaction-description"
        label="Keterangan"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Deskripsi singkat transaksi..."
        rows={3}
      />

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
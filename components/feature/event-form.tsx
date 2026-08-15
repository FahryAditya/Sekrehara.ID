"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

type EventFormProps = {
  submitLabel: string;
  onSubmit: (values: { name: string; date: string; description: string }) => void;
  onCancel: () => void;
};

type FieldErrors = {
  name?: string;
  date?: string;
};

export function EventForm({ submitLabel, onSubmit, onCancel }: EventFormProps) {
  const { showError } = useToast();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const validateForm = (): boolean => {
    const nextErrors: FieldErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Nama kegiatan wajib diisi.";
    }
    if (!date) {
      nextErrors.date = "Tanggal kegiatan wajib diisi.";
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
      name: name.trim(),
      date: new Date(date).toISOString(),
      description: description.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        id="event-name"
        label="Nama Kegiatan"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={fieldErrors.name}
        placeholder="mis. Rapat Koordinasi Mingguan"
      />
      <Input
        id="event-date"
        label="Tanggal Kegiatan"
        type="date"
        value={date}
        onChange={(event) => setDate(event.target.value)}
        error={fieldErrors.date}
      />
      <Textarea
        id="event-description"
        label="Deskripsi (opsional)"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Deskripsi singkat kegiatan..."
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
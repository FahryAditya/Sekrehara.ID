"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

type AnnouncementFormProps = {
  recipientCount: number;
  onSubmit: (values: { subject: string; body: string }) => void;
};

type FieldErrors = {
  subject?: string;
  body?: string;
};

export function AnnouncementForm({ recipientCount, onSubmit }: AnnouncementFormProps) {
  const { showError } = useToast();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const nextErrors: FieldErrors = {};

    if (!subject.trim()) {
      nextErrors.subject = "Subjek pengumuman wajib diisi.";
    }
    if (!body.trim()) {
      nextErrors.body = "Isi pengumuman wajib diisi.";
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

    setIsSubmitting(true);
    window.setTimeout(() => {
      onSubmit({ subject: subject.trim(), body: body.trim() });
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        id="announcement-subject"
        label="Subjek Pengumuman"
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
        error={fieldErrors.subject}
        placeholder="mis. Undangan Rapat Koordinasi"
      />

      <Textarea
        id="announcement-body"
        label="Isi Pengumuman"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        error={fieldErrors.body}
        placeholder="Tulis isi pengumuman yang akan dikirim ke seluruh email peserta..."
        rows={6}
      />

      <div className="flex flex-col gap-1 rounded-md border border-border bg-background px-4 py-3">
        <span className="text-xs text-muted">Jumlah penerima</span>
        <span className="text-sm font-medium text-foreground">
          {recipientCount} email peserta aktif
        </span>
      </div>

      <div className="mt-2 flex justify-end">
        <Button type="submit" size="large" isLoading={isSubmitting}>
          Kirim ke Semua Peserta
        </Button>
      </div>
    </form>
  );
}
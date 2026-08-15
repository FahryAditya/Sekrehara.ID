"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type ParticipantFormProps = {
  initialName?: string;
  initialPhone?: string;
  initialEmail?: string;
  submitLabel: string;
  onSubmit: (values: { name: string; phone: string; email: string }) => void;
  onCancel: () => void;
};

type FieldErrors = {
  name?: string;
  phone?: string;
  email?: string;
};

export function ParticipantForm({
  initialName = "",
  initialPhone = "",
  initialEmail = "",
  submitLabel,
  onSubmit,
  onCancel,
}: ParticipantFormProps) {
  const { showError } = useToast();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const nextErrors: FieldErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Nama lengkap wajib diisi.";
    }

    const phonePattern = /^(\+?62|0)8[0-9]{8,11}$/;
    if (!phone.trim()) {
      nextErrors.phone = "Nomor kontak wajib diisi.";
    } else if (!phonePattern.test(phone.trim())) {
      nextErrors.phone = "Format nomor tidak valid. Contoh: 081234567890.";
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      nextErrors.email = "Alamat email wajib diisi.";
    } else if (!emailPattern.test(email.trim())) {
      nextErrors.email = "Format email tidak valid.";
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
    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
    });
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        id="participant-name"
        label="Nama Lengkap"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={fieldErrors.name}
        placeholder="mis. Ahmad Fauzi"
      />
      <Input
        id="participant-phone"
        label="Nomor Kontak"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        error={fieldErrors.phone}
        placeholder="mis. 081234567890"
        inputMode="tel"
      />
      <Input
        id="participant-email"
        label="Alamat Email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={fieldErrors.email}
        placeholder="mis. ahmad.fauzi@gmail.com"
      />

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
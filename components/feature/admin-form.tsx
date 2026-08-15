"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import type { Role } from "@/lib/types";

type AdminFormProps = {
  submitLabel: string;
  onSubmit: (values: { name: string; email: string; password: string; role: Role }) => void;
  onCancel: () => void;
};

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
};

export function AdminForm({ submitLabel, onSubmit, onCancel }: AdminFormProps) {
  const { showError } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("ADMIN");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const validateForm = (): boolean => {
    const nextErrors: FieldErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Nama lengkap wajib diisi.";
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      nextErrors.email = "Alamat email wajib diisi.";
    } else if (!emailPattern.test(email.trim())) {
      nextErrors.email = "Format email tidak valid.";
    }

    if (!password) {
      nextErrors.password = "Password wajib diisi.";
    } else if (password.length < 6) {
      nextErrors.password = "Password minimal 6 karakter.";
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
      email: email.trim(),
      password,
      role,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        id="admin-name"
        label="Nama Lengkap"
        value={name}
        onChange={(event) => setName(event.target.value)}
        error={fieldErrors.name}
        placeholder="mis. Rina Wijaya"
      />
      <Input
        id="admin-email"
        label="Alamat Email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={fieldErrors.email}
        placeholder="nama@sekrehara.id"
      />
      <Input
        id="admin-password"
        label="Password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={fieldErrors.password}
        placeholder="Minimal 6 karakter"
        autoComplete="new-password"
      />
      <Select
        id="admin-role"
        label="Peran"
        value={role}
        onChange={(event) => setRole(event.target.value as Role)}
      >
        <option value="ADMIN">Admin</option>
        <option value="SUPERADMIN">Super Admin</option>
      </Select>

      <div className="mt-2 flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icons";
import type { Role } from "@/lib/types";

type AdminFormProps = {
  initialName?: string;
  initialEmail?: string;
  initialRole?: Role;
  isEdit?: boolean;
  submitLabel: string;
  onSubmit: (values: { name: string; email: string; password: string; role: Role }) => void;
  onCancel: () => void;
};

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
};

export function AdminForm({
  initialName = "",
  initialEmail = "",
  initialRole = "ADMIN",
  isEdit = false,
  submitLabel,
  onSubmit,
  onCancel,
}: AdminFormProps) {
  const { showError } = useToast();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(initialRole);
  const [showPassword, setShowPassword] = useState(false);
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

    if (!isEdit) {
      if (!password) {
        nextErrors.password = "Password wajib diisi.";
      } else if (password.length < 6) {
        nextErrors.password = "Password minimal 6 karakter.";
      }
    } else if (password && password.length < 6) {
      nextErrors.password = "Password baru minimal 6 karakter.";
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

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="admin-password" className="text-sm font-medium text-foreground">
            {isEdit ? "Password Baru (Kosongkan jika tidak diubah)" : "Password"}
          </label>
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary-hover"
          >
            {showPassword ? <EyeOffIcon className="h-3.5 w-3.5" /> : <EyeIcon className="h-3.5 w-3.5" />}
            {showPassword ? "Sembunyikan" : "Lihat Password"}
          </button>
        </div>
        <Input
          id="admin-password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          placeholder={isEdit ? "Masukkan password baru..." : "Minimal 6 karakter"}
          autoComplete="new-password"
        />
      </div>

      <Select
        id="admin-role"
        label="Peran / Hak Akses"
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
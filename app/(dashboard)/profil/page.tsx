"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import {
  getProfileAction,
  updateProfileAction,
  changePasswordAction,
  type ProfileData,
} from "@/lib/profile-actions";
import { formatDate } from "@/lib/format";

export default function ProfilePage() {
  const { showSuccess, showError } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getProfileAction()
      .then((result) => {
        if (cancelled) return;
        if ("ok" in result && result.ok) {
          setProfile(result.data);
          setName(result.data.name);
          setUsername(result.data.username ?? "");
          setPhone(result.data.phone ?? "");
          setAddress(result.data.address ?? "");
          setDateOfBirth(result.data.dateOfBirth?.slice(0, 10) ?? "");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showError("Nama wajib diisi.");
      return;
    }
    setIsSavingProfile(true);
    const result = await updateProfileAction({
      name: name.trim(),
      username: username.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      dateOfBirth: dateOfBirth || null,
    });
    setIsSavingProfile(false);
    if ("error" in result) {
      showError(result.error);
      return;
    }
    setProfile(result.data);
    showSuccess("Profil berhasil diperbarui.");
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      showError("Password lama wajib diisi.");
      return;
    }
    if (newPassword.length < 6) {
      showError("Password baru minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("Konfirmasi password tidak cocok.");
      return;
    }
    setIsSavingPassword(true);
    const result = await changePasswordAction({
      currentPassword,
      newPassword,
    });
    setIsSavingPassword(false);
    if ("error" in result) {
      showError(result.error);
      return;
    }
    showSuccess("Password berhasil diubah.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-primary">
        <Spinner size="large" />
      </div>
    );
  }

  if (!profile) {
    return (
      <PageHeader title="Profil" description="Data profil tidak ditemukan." />
    );
  }

  return (
    <div>
      <PageHeader
        title="Profil Saya"
        description="Kelola informasi akun dan keamanan Anda."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="h-fit">
          <div className="flex flex-col items-center gap-3 px-6 py-8">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-2xl font-semibold text-primary">
              {profile.name.charAt(0).toUpperCase()}
            </span>
            <div className="flex flex-col items-center gap-1">
              <h2 className="text-base font-semibold text-foreground">{profile.name}</h2>
              <p className="text-sm text-muted">{profile.email}</p>
            </div>
            <Badge variant={profile.role === "SUPERADMIN" ? "primary" : "neutral"}>
              {profile.role === "SUPERADMIN" ? "Super Admin" : "Admin"}
            </Badge>
          </div>
          <div className="border-t border-border px-6 py-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted">Terdaftar sejak</span>
              <span className="text-sm font-medium text-foreground">
                {formatDate(profile.createdAt)}
              </span>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader title="Informasi Profil" subtitle="Perbarui detail akun Anda." />
            <CardBody className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input id="profile-name" label="Nama Lengkap" value={name} onChange={(e) => setName(e.target.value)} />
                <Input id="profile-username" label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <Input id="profile-email" label="Email" value={profile.email} disabled />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input id="profile-phone" label="No. Telepon" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="mis. 081234567890" />
                <Input id="profile-dob" label="Tanggal Lahir" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </div>
              <Input id="profile-address" label="Alamat" value={address} onChange={(e) => setAddress(e.target.value)} />
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} isLoading={isSavingProfile}>
                  Simpan Perubahan
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Ubah Password" subtitle="Ganti password akun Anda secara berkala." />
            <CardBody className="flex flex-col gap-5">
              <Input
                id="current-password"
                label="Password Lama"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  id="new-password"
                  label="Password Baru"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <Input
                  id="confirm-password"
                  label="Konfirmasi Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="flex justify-end">
                <Button variant="secondary" onClick={handleChangePassword} isLoading={isSavingPassword}>
                  Ubah Password
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import type { LoginResult } from "@/lib/auth-context";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckIcon, EyeIcon, EyeOffIcon } from "@/components/ui/icons";
import { combineClassNames } from "@/lib/utils";

type LoginPageContentProps = {
  isAuthenticated: boolean;
  isHydrated: boolean;
  onLogin: (email: string, password: string) => Promise<LoginResult>;
};

function LoginPageContent({ isAuthenticated, isHydrated, onLogin }: LoginPageContentProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isHydrated, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      showError("Email dan password wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    const result = await onLogin(email.trim(), password);
    setIsSubmitting(false);
    if ("error" in result) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      showError(result.error);
      return;
    }

    showSuccess("Berhasil Masuk! Mengalihkan ke Dashboard...");
    setTimeout(() => {
      router.replace("/");
    }, 250);
  };

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-background px-4 py-10">
      <div
        className={combineClassNames(
          "w-full max-w-6xl overflow-hidden rounded-card border border-border bg-surface shadow-card transition-all duration-300",
          isShaking ? "animate-[shake_0.4s_ease-in-out] border-danger/50" : ""
        )}
      >
        <div className="grid lg:grid-cols-2">
          {/* Panel branding */}
          <div className="hidden flex-col justify-between gap-10 bg-primary-soft p-10 lg:flex">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-lg font-semibold text-white">
                S
              </span>
              <span className="text-xl font-semibold text-foreground">SekreHara</span>
            </div>

            <div className="flex flex-col gap-4">
              <h1 className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-foreground">
                Pusat kendali manajemen organisasi Anda
              </h1>
              <p className="max-w-md text-sm leading-6 text-muted">
                Kelola data peserta, catat presensi, pantau arus kas, dan kirim pengumuman — semua
                dalam satu platform.
              </p>
            </div>

            <ul className="flex flex-col gap-3 text-sm text-foreground">
              {["Data peserta terpusat", "Presensi digital harian", "Buku kas otomatis", "Broadcast email massal"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                      <CheckIcon className="h-3 w-3" />
                    </span>
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Panel form */}
          <div className="flex items-center justify-center p-8 sm:p-12">
            <div className="w-full max-w-sm">
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-base font-semibold text-white">
                  S
                </span>
                <span className="text-lg font-semibold text-foreground">SekreHara</span>
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Masuk</h2>
              <p className="mt-1 text-sm text-muted">Akses hanya untuk administrator dan admin.</p>

              <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
                <Input
                  id="login-email"
                  label="Alamat Email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nama@sekrehara.id"
                  autoComplete="email"
                />
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="login-password" className="text-sm font-medium text-foreground">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-primary-dark"
                    >
                      {showPassword ? <EyeOffIcon className="h-3.5 w-3.5" /> : <EyeIcon className="h-3.5 w-3.5" />}
                      {showPassword ? "Sembunyikan" : "Lihat Password"}
                    </button>
                  </div>
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Masukkan password"
                    autoComplete="current-password"
                  />
                </div>

                <Button type="submit" size="large" isLoading={isSubmitting} className="w-full">
                  Masuk
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <ToastProvider>
      <AuthProvider>
        <LoginPageWithAuth />
      </AuthProvider>
    </ToastProvider>
  );
}

function LoginPageWithAuth() {
  const { isAuthenticated, isHydrated, login } = useAuth();
  return (
    <LoginPageContent
      isAuthenticated={isAuthenticated}
      isHydrated={isHydrated}
      onLogin={(email, password) => login(email, password)}
    />
  );
}

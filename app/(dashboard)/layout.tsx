"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { DataStoreProvider } from "@/lib/data-store";
import { ToastProvider } from "@/components/ui/toast";
import { Sidebar } from "@/components/layout/sidebar";
import { NotificationBell } from "@/components/feature/notification-bell";
import { MenuIcon, LogOutIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { combineClassNames } from "@/lib/utils";
import { PageProgressBar } from "@/components/ui/page-progress-bar";

function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { currentUser, isAuthenticated, isHydrated, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isHydrated, router]);

  if (!isHydrated) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center text-primary">
        <Spinner size="large" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex min-h-full">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-border bg-surface px-4 py-6 lg:block">
        <Sidebar currentRole={currentUser.role} />
        <div className="mt-8 border-t border-border pt-4">
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
              {currentUser.name.charAt(0).toUpperCase()}
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-foreground">{currentUser.name}</span>
              <span className="text-xs text-muted">
                {currentUser.role === "SUPERADMIN" ? "Super Admin" : "Admin"}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="small"
            className="mt-2 w-full justify-start"
            onClick={() => {
              void logout().then(() => router.replace("/login"));
            }}
          >
            <LogOutIcon className="h-4 w-4" />
            Keluar
          </Button>
        </div>
      </aside>

      {/* Sidebar mobile */}
      {isSidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-surface px-4 py-6 shadow-modal">
            <Sidebar currentRole={currentUser.role} onNavigate={() => setIsSidebarOpen(false)} />
            <div className="mt-8 border-t border-border pt-4">
              <div className="flex items-center gap-3 px-2 py-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{currentUser.name}</span>
                  <span className="text-xs text-muted">
                    {currentUser.role === "SUPERADMIN" ? "Super Admin" : "Admin"}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="small"
                className="mt-2 w-full justify-start"
                onClick={() => {
                  void logout().then(() => {
                    setIsSidebarOpen(false);
                    router.replace("/login");
                  });
                }}
              >
                <LogOutIcon className="h-4 w-4" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header mobile */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Buka menu navigasi"
            className="rounded-md p-2 text-muted hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border"
          >
            <MenuIcon />
          </button>
          <span className="text-base font-semibold text-foreground">SekreHara</span>
          <span className="ml-auto">
            <NotificationBell />
          </span>
        </header>

        {/* Header desktop */}
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-end border-b border-border bg-surface/90 px-8 backdrop-blur lg:flex">
          <NotificationBell />
        </header>

        <main className={combineClassNames("mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8")}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <DataStoreProvider>
          <Suspense fallback={null}>
            <PageProgressBar />
          </Suspense>
          <DashboardShell>{children}</DashboardShell>
        </DataStoreProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
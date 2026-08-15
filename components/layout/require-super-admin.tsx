"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const router = useRouter();

  if (currentUser && currentUser.role !== "SUPERADMIN") {
    router.replace("/");
    return null;
  }

  return <>{children}</>;
}

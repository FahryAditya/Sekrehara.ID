import "server-only";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export class UnauthorizedError extends Error {
  constructor(message = "Tidak memiliki akses.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function requireUser() {
  const session = await getSession();
  if (!session) {
    throw new UnauthorizedError("Sesi berakhir. Silakan masuk kembali.");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.role !== "ADMIN" && session.role !== "SUPERADMIN") {
    throw new UnauthorizedError("Hanya administrator yang dapat mengakses fitur ini.");
  }
  return session;
}

export async function requireSuperAdmin() {
  const session = await requireUser();
  if (session.role !== "SUPERADMIN") {
    throw new UnauthorizedError("Hanya super admin yang dapat mengakses fitur ini.");
  }
  return session;
}

export async function hasPermission(userId: string, permissionName: string): Promise<boolean> {
  const session = await getSession();
  if (!session || session.id !== userId) return false;
  if (session.role === "SUPERADMIN") return true;

  const rolePermission = await prisma.rolePermission.findFirst({
    where: { role: session.role, permission: { name: permissionName } },
  });

  return rolePermission !== null;
}

export async function requirePermission(permissionName: string) {
  const session = await requireUser();
  if (session.role === "SUPERADMIN") return session;

  const rolePermission = await prisma.rolePermission.findFirst({
    where: { role: session.role, permission: { name: permissionName } },
  });

  if (!rolePermission) {
    throw new UnauthorizedError("Anda tidak memiliki izin untuk aksi ini.");
  }

  return session;
}

export function safeError(error: unknown): string {
  if (error instanceof UnauthorizedError) return error.message;
  if (error instanceof Error) {
    return "Terjadi kesalahan: " + error.message;
  }
  return "Terjadi kesalahan yang tidak diketahui.";
}

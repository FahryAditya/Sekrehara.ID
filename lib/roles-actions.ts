"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/permissions";
import { createActivityLog } from "@/lib/activity-log";
import type { Role } from "./generated/prisma/enums";

export type PermissionItem = {
  id: string;
  name: string;
  description: string | null;
};

export type RolePermissionItem = {
  role: Role;
  permissionId: string;
};

export type RoleManagementResult =
  | { ok: true; data: unknown }
  | { error: string };

export async function listPermissionsAction(): Promise<PermissionItem[]> {
  await requireSuperAdmin();
  const permissions = await prisma.permission.findMany({
    orderBy: { name: "asc" },
  });
  return permissions.map((p) => ({ id: p.id, name: p.name, description: p.description }));
}

export async function getRolePermissionsAction(role: Role): Promise<RolePermissionItem[]> {
  await requireSuperAdmin();
  const items = await prisma.rolePermission.findMany({
    where: { role },
    select: { permissionId: true, role: true },
  });
  return items.map((i) => ({ role: i.role as Role, permissionId: i.permissionId }));
}

export type SetRolePermissionInput = {
  role: Role;
  permissionId: string;
  enabled: boolean;
};

export async function setRolePermissionAction(
  input: SetRolePermissionInput
): Promise<RoleManagementResult> {
  const session = await requireSuperAdmin();

  if (input.role === "SUPERADMIN") {
    return { error: "Hak akses Super Admin tidak dapat diubah." };
  }

  const permission = await prisma.permission.findUnique({
    where: { id: input.permissionId },
  });
  if (!permission) return { error: "Permission tidak ditemukan." };

  if (input.enabled) {
    await prisma.rolePermission.upsert({
      where: {
        role_permissionId: { role: input.role, permissionId: input.permissionId },
      },
      update: {},
      create: { role: input.role, permissionId: input.permissionId },
    });
  } else {
    await prisma.rolePermission.deleteMany({
      where: { role: input.role, permissionId: input.permissionId },
    });
  }

  await createActivityLog(
    session.id,
    "UPDATE_ROLE_PERMISSION",
    "PERMISSION",
    permission.id,
    `${input.enabled ? "Menambah" : "Menghapus"} permission ${permission.name} untuk role ${input.role}`
  );

  return { ok: true, data: null };
}

export type UpdateUserRoleInput = {
  userId: string;
  role: Role;
};

export async function updateUserRoleAction(
  input: UpdateUserRoleInput
): Promise<RoleManagementResult> {
  const session = await requireSuperAdmin();

  const target = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!target) return { error: "Pengguna tidak ditemukan." };

  if (target.id === session.id) {
    return { error: "Anda tidak dapat mengubah role akun sendiri." };
  }

  if (target.role === "SUPERADMIN") {
    return { error: "Role akun Super Admin tidak dapat diubah." };
  }

  await prisma.user.update({
    where: { id: target.id },
    data: { role: input.role },
  });

  await createActivityLog(
    session.id,
    "ASSIGN_ROLE",
    "USER",
    target.id,
    `Role ${target.email} diubah menjadi ${input.role}`
  );

  return { ok: true, data: null };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  listPermissionsAction,
  getRolePermissionsAction,
  setRolePermissionAction,
  updateUserRoleAction,
  type PermissionItem,
} from "@/lib/roles-actions";
import { listUsersAction, type AdminUserItem } from "@/lib/users-actions";
import { ShieldIcon } from "@/components/ui/icons";
import type { Role } from "@/lib/generated/prisma/enums";
import { combineClassNames } from "@/lib/utils";

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  SUPERADMIN: "Super Admin",
};

export default function RolesPage() {
  const { showSuccess, showError } = useToast();
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [enabledMap, setEnabledMap] = useState<Record<string, Record<string, boolean>>>({});
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPermissions = useCallback(() => {
    Promise.all([listPermissionsAction(), getRolePermissionsAction("ADMIN")])
      .then(([permissionList, rolePermissions]) => {
        setPermissions(permissionList);
        const map: Record<string, boolean> = {};
        for (const item of rolePermissions) {
          map[item.permissionId] = true;
        }
        setEnabledMap((current) => ({ ...current, ADMIN: map }));
      })
      .catch((error) => {
        showError(error instanceof Error ? error.message : "Gagal memuat permission.");
      });
  }, [showError]);

  const loadUsers = useCallback(() => {
    listUsersAction()
      .then(setUsers)
      .catch((error) => {
        showError(error instanceof Error ? error.message : "Gagal memuat pengguna.");
      });
  }, [showError]);

  useEffect(() => {
    Promise.all([
      listPermissionsAction(),
      getRolePermissionsAction("ADMIN"),
      listUsersAction(),
    ])
      .then(([permissionList, rolePermissions, userList]) => {
        setPermissions(permissionList);
        const map: Record<string, boolean> = {};
        for (const item of rolePermissions) {
          map[item.permissionId] = true;
        }
        setEnabledMap({ ADMIN: map });
        setUsers(userList);
      })
      .catch((error) => {
        showError(error instanceof Error ? error.message : "Gagal memuat halaman perizinan.");
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTogglePermission = async (role: Role, permission: PermissionItem, enabled: boolean) => {
    setEnabledMap((current) => ({
      ...current,
      [role]: { ...(current[role] ?? {}), [permission.id]: enabled },
    }));
    const result = await setRolePermissionAction({ role, permissionId: permission.id, enabled });
    if ("error" in result) {
      showError(result.error);
      loadPermissions();
      return;
    }
    showSuccess(`${enabled ? "Mengaktifkan" : "Menonaktifkan"} permission "${permission.name}" untuk ${roleLabels[role]}.`);
  };

  const handleChangeUserRole = async (userId: string, role: Role) => {
    const result = await updateUserRoleAction({ userId, role });
    if ("error" in result) {
      showError(result.error);
      loadUsers();
      return;
    }
    showSuccess("Role pengguna diperbarui.");
    loadUsers();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-primary">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Perizinan & Role"
        description="Kelola hak akses role dan tetapkan role pengguna."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Hak Akses Admin"
              subtitle="Permission yang dimiliki role Admin"
            />
            <CardBody>
              <div className="flex flex-col gap-2">
                {permissions.map((permission) => {
                  const enabled = enabledMap.ADMIN?.[permission.id] ?? false;
                  return (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{permission.name}</p>
                        {permission.description ? (
                          <p className="truncate text-xs text-muted">{permission.description}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        aria-label={`Toggle ${permission.name}`}
                        onClick={() => handleTogglePermission("ADMIN", permission, !enabled)}
                        className={combineClassNames(
                          "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                          enabled ? "bg-primary" : "bg-zinc-300"
                        )}
                      >
                        <span
                          className={combineClassNames(
                            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                            enabled ? "left-5.5 translate-x-0" : "left-0.5"
                          )}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          <Card className="mt-6">
            <CardHeader
              title="Super Admin"
              subtitle="Hak akses Super Admin tidak dapat diubah"
            />
            <CardBody>
              <div className="flex items-center gap-3 rounded-md border border-border bg-background px-4 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-soft text-primary">
                  <ShieldIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Akses penuh</p>
                  <p className="text-xs text-muted">
                    Super Admin memiliki seluruh permission secara otomatis dan tidak dapat dimodifikasi.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader title="Role Pengguna" subtitle="Tetapkan role untuk setiap akun" />
            <CardBody>
              {users.length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {users.map((user) => (
                    <li key={user.id} className="rounded-md border border-border bg-background px-4 py-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                          <p className="truncate text-xs text-muted">{user.email}</p>
                        </div>
                        <Badge variant={user.role === "SUPERADMIN" ? "primary" : "neutral"}>
                          {roleLabels[user.role] ?? user.role}
                        </Badge>
                      </div>
                      <Select
                        id={`user-role-${user.id}`}
                        value={user.role}
                        disabled={user.role === "SUPERADMIN"}
                        onChange={(e) => handleChangeUserRole(user.id, e.target.value as Role)}
                        className="h-8 w-full"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="SUPERADMIN" disabled>
                          Super Admin
                        </option>
                      </Select>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">Tidak ada pengguna.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

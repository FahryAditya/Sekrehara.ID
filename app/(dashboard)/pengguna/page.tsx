"use client";

import { useState } from "react";
import { useDataStore } from "@/lib/data-store";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Table } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { AdminForm } from "@/components/feature/admin-form";
import { RequireSuperAdmin } from "@/components/layout/require-super-admin";
import { PlusIcon, ShieldIcon, TrashIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/format";
import type { Role } from "@/lib/types";
import type { AdminUserItem } from "@/lib/users-actions";

export default function PenggunaPage() {
  return (
    <RequireSuperAdmin>
      <PenggunaPageContent />
    </RequireSuperAdmin>
  );
}

function PenggunaPageContent() {
  const { users, addUser, deleteUser } = useDataStore();
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleAddUser = async (values: { name: string; email: string; password: string; role: Role }) => {
    const emailExists = users.some(
      (user) => user.email.toLowerCase() === values.email.toLowerCase()
    );
    if (emailExists) {
      showError("Email tersebut sudah terdaftar sebagai pengguna.");
      return;
    }

    const result = await addUser(values);
    if (!result.ok) {
      showError(result.error ?? "Gagal menambah pengguna.");
      return;
    }
    showSuccess("Pengguna baru berhasil ditambahkan.");
    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    const result = await deleteUser(userToDelete.id);
    setIsDeleting(false);
    if (!result.ok) {
      showError(result.error ?? "Gagal menghapus pengguna.");
      return;
    }
    showSuccess(`Pengguna "${userToDelete.name}" berhasil dihapus.`);
    setUserToDelete(null);
  };

  const canDeleteUser = (user: AdminUserItem) => user.id !== currentUser?.id;

  return (
    <div>
      <PageHeader
        title="Kelola Pengguna"
        description="Atur akun administrator dan super admin yang dapat mengakses dashboard."
        action={
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Tambah Pengguna
          </Button>
        }
      />

      <Card>
        {users.length > 0 ? (
          <Table
            columns={[
              {
                header: "Nama",
                accessor: (user: AdminUserItem) => (
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-medium text-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="font-medium text-foreground">
                      {user.name}
                      {user.id === currentUser?.id ? (
                        <span className="ml-2 text-xs font-normal text-muted">(Anda)</span>
                      ) : null}
                    </span>
                  </div>
                ),
              },
              {
                header: "Email",
                accessor: (user: AdminUserItem) => user.email,
              },
              {
                header: "Peran",
                accessor: (user: AdminUserItem) => (
                  <Badge variant={user.role === "SUPERADMIN" ? "primary" : "neutral"}>
                    {user.role === "SUPERADMIN" ? "Super Admin" : "Admin"}
                  </Badge>
                ),
              },
              {
                header: "Terdaftar",
                accessor: (user: AdminUserItem) => formatDate(user.createdAt),
              },
              {
                header: "Aksi",
                accessor: (user: AdminUserItem) => (
                  <Button
                    variant="ghost"
                    size="small"
                    aria-label={`Hapus pengguna ${user.name}`}
                    className="text-danger hover:bg-danger-soft hover:text-danger disabled:pointer-events-none disabled:opacity-40"
                    disabled={!canDeleteUser(user)}
                    onClick={() => setUserToDelete(user)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                ),
              },
            ]}
            data={users}
            rowKey={(user) => user.id}
          />
        ) : (
          <EmptyState
            icon={<ShieldIcon className="h-6 w-6" />}
            title="Belum ada pengguna"
            description="Tambahkan pengguna admin pertama untuk mengelola dashboard."
          />
        )}
      </Card>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Pengguna"
        description="Buat akun administrator baru untuk mengakses dashboard."
      >
        <AdminForm
          submitLabel="Tambah Pengguna"
          onSubmit={handleAddUser}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={userToDelete !== null}
        title="Hapus Pengguna"
        message={
          userToDelete
            ? `Anda yakin ingin menghapus pengguna "${userToDelete.name}" (${userToDelete.email})? Pengguna tersebut tidak akan dapat lagi mengakses dashboard.`
            : ""
        }
        confirmLabel="Hapus Pengguna"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setUserToDelete(null)}
      />
    </div>
  );
}

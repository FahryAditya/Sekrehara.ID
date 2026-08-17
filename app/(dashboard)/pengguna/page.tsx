"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
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
import { Spinner } from "@/components/ui/spinner";
import { RequireSuperAdmin } from "@/components/layout/require-super-admin";
import { PlusIcon, ShieldIcon, PencilIcon, TrashIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/format";
import type { Role } from "@/lib/types";
import {
  listUsersAction,
  createUserAction,
  updateUserAction,
  deleteUserAction,
  type AdminUserItem,
} from "@/lib/users-actions";

const AdminForm = dynamic(
  () => import("@/components/feature/admin-form").then((m) => m.AdminForm),
  { ssr: false, loading: () => null }
);

type ModalState =
  | { mode: "add"; user: null }
  | { mode: "edit"; user: AdminUserItem }
  | null;

export default function PenggunaPage() {
  return (
    <RequireSuperAdmin>
      <PenggunaPageContent />
    </RequireSuperAdmin>
  );
}

function PenggunaPageContent() {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalState, setModalState] = useState<ModalState>(null);
  const [userToDelete, setUserToDelete] = useState<AdminUserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(() => {
    listUsersAction()
      .then(setUsers)
      .catch((loadError) => {
        showError(loadError instanceof Error ? loadError.message : "Gagal memuat pengguna.");
      })
      .finally(() => setIsLoading(false));
  }, [showError]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmitForm = async (values: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }) => {
    if (modalState?.mode === "edit" && modalState.user) {
      const result = await updateUserAction({
        id: modalState.user.id,
        name: values.name,
        email: values.email,
        role: values.role,
        password: values.password || undefined,
      });

      if ("error" in result) {
        showError(result.error);
        return;
      }
      showSuccess(`Data pengguna "${values.name}" berhasil diperbarui.`);
    } else {
      const result = await createUserAction(values);
      if ("error" in result) {
        showError(result.error);
        return;
      }
      showSuccess("Pengguna baru berhasil ditambahkan.");
    }
    setModalState(null);
    load();
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    const result = await deleteUserAction(userToDelete.id);
    setIsDeleting(false);
    if ("error" in result) {
      showError(result.error);
      return;
    }
    showSuccess(`Pengguna "${userToDelete.name}" berhasil dihapus.`);
    setUserToDelete(null);
    load();
  };

  const canDeleteUser = (user: AdminUserItem) => user.id !== currentUser?.id;

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
        title="Kelola Pengguna"
        description="Atur akun administrator dan super admin yang dapat mengakses dashboard."
        action={
          <Button onClick={() => setModalState({ mode: "add", user: null })}>
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
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="small"
                      aria-label={`Edit ${user.name}`}
                      title="Edit Nama, Email & Password"
                      onClick={() => setModalState({ mode: "edit", user })}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="small"
                      aria-label={`Hapus pengguna ${user.name}`}
                      title="Hapus Pengguna"
                      className="text-danger hover:bg-danger-soft hover:text-danger disabled:pointer-events-none disabled:opacity-40"
                      disabled={!canDeleteUser(user)}
                      onClick={() => setUserToDelete(user)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
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
            action={
              <Button onClick={() => setModalState({ mode: "add", user: null })}>
                <PlusIcon className="h-4 w-4" />
                Tambah Pengguna
              </Button>
            }
          />
        )}
      </Card>

      <Modal
        open={modalState !== null}
        onClose={() => setModalState(null)}
        title={modalState?.mode === "edit" ? "Edit Pengguna & Password" : "Tambah Pengguna"}
        description={
          modalState?.mode === "edit"
            ? `Edit informasi, email, peran, atau ubah password untuk ${modalState.user.name}.`
            : "Buat akun administrator baru untuk mengakses dashboard."
        }
      >
        {modalState ? (
          <AdminForm
            key={modalState.mode === "edit" ? modalState.user.id : "add"}
            initialName={modalState.mode === "edit" ? modalState.user.name : ""}
            initialEmail={modalState.mode === "edit" ? modalState.user.email : ""}
            initialRole={modalState.mode === "edit" ? modalState.user.role : "ADMIN"}
            isEdit={modalState.mode === "edit"}
            submitLabel={modalState.mode === "edit" ? "Simpan Perubahan" : "Tambah Pengguna"}
            onSubmit={handleSubmitForm}
            onCancel={() => setModalState(null)}
          />
        ) : null}
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

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SearchInput } from "@/components/ui/search-input";
import { Table } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/format";
import {
  listAllMembersAction,
  createMemberAction,
  updateMemberAction,
  deleteMemberAction,
  type MemberListItem,
} from "@/lib/members-actions";

const ParticipantForm = dynamic(
  () => import("@/components/feature/participant-form").then((m) => m.ParticipantForm),
  { ssr: false, loading: () => null }
);

type ModalState =
  | { mode: "add"; participant: null }
  | { mode: "edit"; participant: MemberListItem }
  | null;

export default function PesertaPage() {
  const { showSuccess, showError } = useToast();

  const [participants, setParticipants] = useState<MemberListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalState, setModalState] = useState<ModalState>(null);
  const [participantToDelete, setParticipantToDelete] = useState<MemberListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(() => {
    listAllMembersAction()
      .then(setParticipants)
      .catch((loadError) => {
        showError(loadError instanceof Error ? loadError.message : "Gagal memuat peserta.");
      })
      .finally(() => setIsLoading(false));
  }, [showError]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredParticipants = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return participants;

    return participants.filter(
      (participant) =>
        participant.name.toLowerCase().includes(normalizedQuery) ||
        (participant.email ?? "").toLowerCase().includes(normalizedQuery) ||
        (participant.kelas ?? "").toLowerCase().includes(normalizedQuery)
    );
  }, [participants, searchQuery]);

  const handleSubmitForm = async (values: {
    name: string;
    phone: string;
    email: string;
    kelas: string;
    jurusan: string;
    nomorInduk: string;
  }) => {
    if (modalState?.mode === "edit" && modalState.participant) {
      const result = await updateMemberAction(modalState.participant.id, values);
      if ("error" in result) {
        showError(result.error);
        return;
      }
      showSuccess("Data peserta berhasil diperbarui.");
    } else {
      const result = await createMemberAction(values);
      if ("error" in result) {
        showError(result.error);
        return;
      }
      showSuccess("Peserta baru berhasil ditambahkan.");
    }
    setModalState(null);
    load();
  };

  const handleConfirmDelete = async () => {
    if (!participantToDelete) return;

    setIsDeleting(true);
    const result = await deleteMemberAction(participantToDelete.id);
    setIsDeleting(false);
    if ("error" in result) {
      showError(result.error);
      return;
    }
    showSuccess("Peserta berhasil dihapus.");
    setParticipantToDelete(null);
    load();
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
        title="Data Peserta"
        description="Kelola nama, kelas, nomor kontak, dan email anggota organisasi."
        action={
          <Button onClick={() => setModalState({ mode: "add", participant: null })}>
            <PlusIcon className="h-4 w-4" />
            Tambah Peserta
          </Button>
        }
      />

      <div className="mb-5 flex max-w-sm">
        <SearchInput
          id="participant-search"
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Cari nama, email, atau kelas..."
        />
      </div>

      <Card>
        {filteredParticipants.length > 0 ? (
          <Table
            columns={[
              {
                header: "Nama Lengkap",
                accessor: (participant: MemberListItem) => (
                  <span className="font-medium text-foreground">{participant.name}</span>
                ),
              },
              {
                header: "Kelas / Jurusan",
                accessor: (participant: MemberListItem) =>
                  participant.kelas || participant.jurusan ? (
                    <span className="text-muted">
                      {[participant.kelas, participant.jurusan].filter(Boolean).join(" · ")}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  ),
              },
              {
                header: "Nomor Kontak",
                accessor: (participant: MemberListItem) => participant.phone ?? "—",
              },
              {
                header: "Email",
                accessor: (participant: MemberListItem) => participant.email ?? "—",
              },
              {
                header: "Status",
                accessor: (participant: MemberListItem) => (
                  <Badge variant={participant.status === "AKTIF" ? "success" : "neutral"}>
                    {participant.status === "AKTIF" ? "Aktif" : "Tidak Aktif"}
                  </Badge>
                ),
              },
              {
                header: "Terdaftar",
                accessor: (participant: MemberListItem) => formatDate(participant.createdAt),
              },
              {
                header: "Aksi",
                accessor: (participant: MemberListItem) => (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="small"
                      aria-label={`Edit ${participant.name}`}
                      onClick={() => setModalState({ mode: "edit", participant })}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="small"
                      aria-label={`Hapus ${participant.name}`}
                      className="text-danger hover:bg-danger-soft hover:text-danger"
                      onClick={() => setParticipantToDelete(participant)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ),
              },
            ]}
            data={filteredParticipants}
            rowKey={(participant) => participant.id}
          />
        ) : (
          <EmptyState
            icon={<UsersIcon className="h-6 w-6" />}
            title={searchQuery ? "Peserta tidak ditemukan" : "Belum ada peserta"}
            description={
              searchQuery
                ? `Tidak ada peserta yang cocok dengan "${searchQuery}".`
                : "Tambahkan peserta pertama untuk mulai mengelola data."
            }
            action={
              !searchQuery ? (
                <Button onClick={() => setModalState({ mode: "add", participant: null })}>
                  <PlusIcon className="h-4 w-4" />
                  Tambah Peserta
                </Button>
              ) : (
                <Badge variant="outline">Coba kata kunci lain</Badge>
              )
            }
          />
        )}
      </Card>

      <Modal
        open={modalState !== null}
        onClose={() => setModalState(null)}
        title={modalState?.mode === "edit" ? "Edit Peserta" : "Tambah Peserta"}
        description={
          modalState?.mode === "edit"
            ? "Perbarui informasi peserta di bawah ini."
            : "Lengkapi informasi peserta yang baru."
        }
      >
        {modalState ? (
          <ParticipantForm
            key={modalState.mode === "edit" ? modalState.participant.id : "add"}
            initialName={modalState.mode === "edit" ? modalState.participant.name : ""}
            initialPhone={modalState.mode === "edit" ? modalState.participant.phone ?? "" : ""}
            initialEmail={modalState.mode === "edit" ? modalState.participant.email ?? "" : ""}
            initialKelas={modalState.mode === "edit" ? modalState.participant.kelas ?? "" : ""}
            initialJurusan={modalState.mode === "edit" ? modalState.participant.jurusan ?? "" : ""}
            initialNomorInduk={
              modalState.mode === "edit" ? modalState.participant.nomorInduk ?? "" : ""
            }
            submitLabel={modalState.mode === "edit" ? "Simpan Perubahan" : "Tambah Peserta"}
            onSubmit={handleSubmitForm}
            onCancel={() => setModalState(null)}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={participantToDelete !== null}
        title="Hapus Peserta"
        message={
          participantToDelete
            ? `Anda yakin ingin menghapus "${participantToDelete.name}"? Tindakan ini tidak dapat dibatalkan dan data presensi terkait akan ikut terhapus.`
            : ""
        }
        confirmLabel="Hapus Peserta"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setParticipantToDelete(null)}
      />
    </div>
  );
}

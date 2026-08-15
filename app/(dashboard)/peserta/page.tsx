"use client";

import { useMemo, useState } from "react";
import { useDataStore } from "@/lib/data-store";
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
import { ParticipantForm } from "@/components/feature/participant-form";
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/format";
import type { Participant } from "@/lib/types";

type ModalState =
  | { mode: "add"; participant: null }
  | { mode: "edit"; participant: Participant }
  | null;

export default function PesertaPage() {
  const { participants, addParticipant, updateParticipant, deleteParticipant } = useDataStore();
  const { showSuccess } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [modalState, setModalState] = useState<ModalState>(null);
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredParticipants = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return participants;

    return participants.filter(
      (participant) =>
        participant.name.toLowerCase().includes(normalizedQuery) ||
        participant.email.toLowerCase().includes(normalizedQuery)
    );
  }, [participants, searchQuery]);

  const handleSubmitForm = (values: { name: string; phone: string; email: string }) => {
    if (modalState?.mode === "edit" && modalState.participant) {
      updateParticipant(modalState.participant.id, values);
      showSuccess("Data peserta berhasil diperbarui.");
    } else {
      addParticipant(values);
      showSuccess("Peserta baru berhasil ditambahkan.");
    }
    setModalState(null);
  };

  const handleConfirmDelete = () => {
    if (!participantToDelete) return;

    setIsDeleting(true);
    deleteParticipant(participantToDelete.id);
    showSuccess("Peserta berhasil dihapus.");
    setIsDeleting(false);
    setParticipantToDelete(null);
  };

  return (
    <div>
      <PageHeader
        title="Data Peserta"
        description="Kelola nama, nomor kontak, dan email peserta organisasi."
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
          placeholder="Cari nama atau email peserta..."
        />
      </div>

      <Card>
        {filteredParticipants.length > 0 ? (
          <Table
            columns={[
              {
                header: "Nama Lengkap",
                accessor: (participant: Participant) => (
                  <span className="font-medium text-foreground">{participant.name}</span>
                ),
              },
              {
                header: "Nomor Kontak",
                accessor: (participant: Participant) => participant.phone,
              },
              {
                header: "Email",
                accessor: (participant: Participant) => participant.email,
              },
              {
                header: "Terdaftar",
                accessor: (participant: Participant) => formatDate(participant.createdAt),
              },
              {
                header: "Aksi",
                accessor: (participant: Participant) => (
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
            initialPhone={modalState.mode === "edit" ? modalState.participant.phone : ""}
            initialEmail={modalState.mode === "edit" ? modalState.participant.email : ""}
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
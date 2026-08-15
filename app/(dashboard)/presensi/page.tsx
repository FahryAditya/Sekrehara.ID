"use client";

import { useState } from "react";
import Link from "next/link";
import { useDataStore } from "@/lib/data-store";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { EventForm } from "@/components/feature/event-form";
import { PlusIcon, ClipboardCheckIcon, CalendarIcon, TrashIcon } from "@/components/ui/icons";
import { formatDate, formatPercent } from "@/lib/format";
import type { EventItem } from "@/lib/events-actions";

export default function PresensiPage() {
  const { events, attendance, participants, addEvent, deleteEvent } = useDataStore();
  const { showSuccess, showError } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sortedEvents = [...events].sort((a, b) => b.date.localeCompare(a.date));

  const handleCreateEvent = async (values: { name: string; date: string; description: string }) => {
    const result = await addEvent(values);
    if (!result.ok) {
      showError(result.error ?? "Gagal membuat kegiatan.");
      return;
    }
    showSuccess("Kegiatan baru berhasil dibuat.");
    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;

    setIsDeleting(true);
    const result = await deleteEvent(eventToDelete.id);
    setIsDeleting(false);
    if (!result.ok) {
      showError(result.error ?? "Gagal menghapus kegiatan.");
      return;
    }
    showSuccess("Kegiatan berhasil dihapus.");
    setEventToDelete(null);
  };

  return (
    <div>
      <PageHeader
        title="Presensi Kegiatan"
        description="Buat kegiatan dan catat kehadiran peserta dengan cepat."
        action={
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Buat Kegiatan
          </Button>
        }
      />

      {sortedEvents.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {sortedEvents.map((event) => {
            const records = attendance[event.id] ?? {};
            const recordedCount = Object.keys(records).length;
            const hadirCount = Object.values(records).filter(
              (status) => status === "HADIR"
            ).length;

            return (
              <Card key={event.id} className="flex flex-col p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-soft text-primary">
                    <CalendarIcon className="h-5 w-5" />
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="small"
                      aria-label={`Hapus kegiatan ${event.name}`}
                      className="text-danger hover:bg-danger-soft hover:text-danger"
                      onClick={() => setEventToDelete(event)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <h2 className="text-base font-semibold text-foreground">{event.name}</h2>
                <p className="mt-1 text-sm text-muted">{formatDate(event.date)}</p>
                {event.description ? (
                  <p className="mt-3 line-clamp-2 text-sm text-muted">{event.description}</p>
                ) : null}

                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {recordedCount}/{participants.length} tercatat
                    </Badge>
                    {recordedCount > 0 ? (
                      <Badge variant="success">{formatPercent(hadirCount, recordedCount)} hadir</Badge>
                    ) : null}
                  </div>
                  <Link href={`/presensi/${event.id}`}>
                    <Button variant="secondary" size="small">
                      Buka Presensi
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<ClipboardCheckIcon className="h-6 w-6" />}
            title="Belum ada kegiatan"
            description="Buat kegiatan pertama untuk mulai mencatat kehadiran peserta."
            action={
              <Button onClick={() => setIsModalOpen(true)}>
                <PlusIcon className="h-4 w-4" />
                Buat Kegiatan
              </Button>
            }
          />
        </Card>
      )}

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Kegiatan Baru"
        description="Lengkapi informasi kegiatan yang akan dicatat presensinya."
      >
        <EventForm
          submitLabel="Buat Kegiatan"
          onSubmit={handleCreateEvent}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={eventToDelete !== null}
        title="Hapus Kegiatan"
        message={
          eventToDelete
            ? `Anda yakin ingin menghapus kegiatan "${eventToDelete.name}"? Seluruh catatan presensi kegiatan ini akan ikut terhapus.`
            : ""
        }
        confirmLabel="Hapus Kegiatan"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setEventToDelete(null)}
      />
    </div>
  );
}
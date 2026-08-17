"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  listMeetingsAction,
  createMeetingAction,
  deleteMeetingAction,
  type MeetingItem,
} from "@/lib/meetings-actions";
import { listAllMembersAction, type MemberListItem } from "@/lib/members-actions";
import { PlusIcon, CalendarIcon, TrashIcon } from "@/components/ui/icons";
import { formatDateTime } from "@/lib/format";
import { getCache, setCache } from "@/lib/cache-store";

const statusLabel: Record<string, string> = {
  DRAFT: "Draft",
  TERJADWAL: "Terjadwal",
  BERLANGSUNG: "Berlangsung",
  SELESAI: "Selesai",
};

const statusVariant: Record<string, "neutral" | "primary" | "success" | "warning"> = {
  DRAFT: "neutral",
  TERJADWAL: "primary",
  BERLANGSUNG: "warning",
  SELESAI: "success",
};

export default function MeetingsPage() {
  const { showSuccess, showError } = useToast();
  const cachedMeetings = getCache<MeetingItem[]>("meetings");
  const cachedMembers = getCache<MemberListItem[]>("members");

  const [items, setItems] = useState<MeetingItem[]>(cachedMeetings ?? []);
  const [members, setMembers] = useState<MemberListItem[]>(cachedMembers ?? []);
  const [isLoading, setIsLoading] = useState(!cachedMeetings);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("TERJADWAL");
  const [picId, setPicId] = useState("");
  const [participantIds, setParticipantIds] = useState<string[]>([]);

  const [meetingToDelete, setMeetingToDelete] = useState<MeetingItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = () => {
    Promise.all([listMeetingsAction(), listAllMembersAction()])
      .then(([meetingsResult, membersResult]) => {
        setCache("meetings", meetingsResult);
        setCache("members", membersResult);
        setItems(meetingsResult);
        setMembers(membersResult);
      })
      .catch((error) => {
        showError(error instanceof Error ? error.message : "Gagal memuat rapat.");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) {
      showError("Nama rapat wajib diisi.");
      return;
    }
    if (!scheduledDate) {
      showError("Tanggal rapat wajib diisi.");
      return;
    }
    setIsSubmitting(true);
    const result = await createMeetingAction({
      title: title.trim(),
      description: description.trim() || null,
      scheduledDate,
      location: location.trim() || null,
      status: status as MeetingItem["status"],
      picId: picId || null,
      participantIds: participantIds.length ? participantIds : undefined,
    });
    setIsSubmitting(false);
    if ("error" in result) {
      showError(result.error);
      return;
    }
    showSuccess("Rapat berhasil dibuat.");
    setIsModalOpen(false);
    setTitle("");
    setDescription("");
    setScheduledDate("");
    setLocation("");
    setStatus("TERJADWAL");
    setPicId("");
    setParticipantIds([]);
    load();
  };

  const handleConfirmDelete = async () => {
    if (!meetingToDelete) return;
    setIsDeleting(true);
    const result = await deleteMeetingAction(meetingToDelete.id);
    setIsDeleting(false);
    if ("error" in result) {
      showError(result.error);
      return;
    }
    showSuccess(`Rapat "${meetingToDelete.title}" dihapus.`);
    setMeetingToDelete(null);
    load();
  };

  const toggleParticipant = (memberId: string) => {
    setParticipantIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId]
    );
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
        title="Rapat"
        description="Kelola jadwal rapat, notulen, keputusan, dan tindak lanjut."
        action={
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Buat Rapat
          </Button>
        }
      />

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-col p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-soft text-primary">
                  <CalendarIcon className="h-5 w-5" />
                </span>
                <div className="flex items-center gap-1">
                  <Badge variant={statusVariant[item.status] ?? "neutral"}>
                    {statusLabel[item.status] ?? item.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="small"
                    aria-label={`Hapus rapat ${item.title}`}
                    className="text-danger hover:bg-danger-soft hover:text-danger"
                    onClick={() => setMeetingToDelete(item)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <h2 className="text-base font-semibold text-foreground">{item.title}</h2>
              <p className="mt-1 text-sm text-muted">
                {formatDateTime(item.scheduledDate)}
                {item.location ? ` · ${item.location}` : ""}
              </p>
              {item.picName ? <p className="mt-1 text-xs text-muted">PIC: {item.picName}</p> : null}
              {item.description ? (
                <p className="mt-3 line-clamp-2 text-sm text-muted">{item.description}</p>
              ) : null}

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <Badge variant="outline">
                  {item.participantCount} peserta · {item.attendanceCount} hadir
                </Badge>
                <Link href={`/rapat/${item.id}`}>
                  <Button variant="secondary" size="small">
                    Detail
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<CalendarIcon className="h-6 w-6" />}
            title="Belum ada rapat"
            description="Buat rapat pertama untuk mencatat notulen dan keputusan."
            action={
              <Button onClick={() => setIsModalOpen(true)}>
                <PlusIcon className="h-4 w-4" />
                Buat Rapat
              </Button>
            }
          />
        </Card>
      )}

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Rapat Baru"
        description="Atur jadwal, lokasi, dan peserta rapat."
        maxWidth="large"
      >
        <div className="flex flex-col gap-5">
          <Input
            id="meeting-title"
            label="Nama Rapat"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="mis. Rapat Koordinasi Bulanan"
          />
          <Input
            id="meeting-date"
            label="Waktu Rapat"
            type="datetime-local"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              id="meeting-location"
              label="Lokasi (opsional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="mis. Ruang OSIS"
            />
            <Select id="meeting-pic" label="PIC (opsional)" value={picId} onChange={(e) => setPicId(e.target.value)}>
              <option value="">— Pilih PIC —</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </div>
          <Select id="meeting-status" label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="DRAFT">Draft</option>
            <option value="TERJADWAL">Terjadwal</option>
            <option value="BERLANGSUNG">Berlangsung</option>
          </Select>
          <Textarea
            id="meeting-description"
            label="Deskripsi (opsional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi singkat rapat..."
            rows={3}
          />

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-foreground">Undang Peserta</legend>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
              {members.length > 0 ? (
                <ul className="divide-y divide-border">
                  {members.map((member) => {
                    const checked = participantIds.includes(member.id);
                    return (
                      <li key={member.id}>
                        <button
                          type="button"
                          onClick={() => toggleParticipant(member.id)}
                          aria-pressed={checked}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-background"
                        >
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                              checked ? "border-primary bg-primary text-white" : "border-border"
                            }`}
                          >
                            {checked ? "✓" : ""}
                          </span>
                          <span className="font-medium text-foreground">{member.name}</span>
                          {member.kelas ? (
                            <span className="ml-auto text-xs text-muted">{member.kelas}</span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="px-4 py-3 text-sm text-muted">Belum ada anggota untuk diundang.</p>
              )}
            </div>
          </fieldset>

          <div className="mt-2 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreate} isLoading={isSubmitting}>
              Buat Rapat
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={meetingToDelete !== null}
        title="Hapus Rapat"
        message={
          meetingToDelete
            ? `Anda yakin ingin menghapus rapat "${meetingToDelete.title}"? Seluruh notulen, keputusan, dan tindak lanjut akan ikut terhapus.`
            : ""
        }
        confirmLabel="Hapus Rapat"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setMeetingToDelete(null)}
      />
    </div>
  );
}

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
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  listAgendaAction,
  createAgendaAction,
  deleteAgendaAction,
  type AgendaItem,
} from "@/lib/agenda-actions";
import { listAllMembersAction, type MemberListItem } from "@/lib/members-actions";
import { PlusIcon, CalendarIcon, TrashIcon } from "@/components/ui/icons";
import { formatDateTime } from "@/lib/format";

const statusLabel: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Terbit",
  SELESAI: "Selesai",
  BATAL: "Batal",
};

const statusVariant: Record<string, "neutral" | "primary" | "success" | "danger"> = {
  DRAFT: "neutral",
  PUBLISHED: "primary",
  SELESAI: "success",
  BATAL: "danger",
};

export default function AgendaPage() {
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [participantIds, setParticipantIds] = useState<string[]>([]);

  const load = () => {
    Promise.all([listAgendaAction(), listAllMembersAction()])
      .then(([agendaResult, membersResult]) => {
        setItems(agendaResult.data);
        setMembers(membersResult);
      })
      .catch((error) => {
        showError(error instanceof Error ? error.message : "Gagal memuat agenda.");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) {
      showError("Judul agenda wajib diisi.");
      return;
    }
    if (!startDate) {
      showError("Tanggal mulai wajib diisi.");
      return;
    }
    setIsSubmitting(true);
    const result = await createAgendaAction({
      title: title.trim(),
      description: description.trim() || null,
      startDate,
      endDate: endDate || null,
      location: location.trim() || null,
      status: status as AgendaItem["status"],
      participantIds: participantIds.length ? participantIds : undefined,
    });
    setIsSubmitting(false);
    if ("error" in result) {
      showError(result.error);
      return;
    }
    showSuccess("Agenda berhasil dibuat.");
    setIsModalOpen(false);
    setTitle("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setLocation("");
    setStatus("DRAFT");
    setParticipantIds([]);
    load();
  };

  const handleDelete = async (id: string, name: string) => {
    const result = await deleteAgendaAction(id);
    if ("error" in result) {
      showError(result.error);
      return;
    }
    showSuccess(`Agenda "${name}" dihapus.`);
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
        title="Agenda Kegiatan"
        description="Rencanakan kegiatan dan atur daftar hadir."
        action={
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Buat Agenda
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
                    aria-label={`Hapus agenda ${item.title}`}
                    className="text-danger hover:bg-danger-soft hover:text-danger"
                    onClick={() => handleDelete(item.id, item.title)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <h2 className="text-base font-semibold text-foreground">{item.title}</h2>
              <p className="mt-1 text-sm text-muted">
                {formatDateTime(item.startDate)}
                {item.location ? ` · ${item.location}` : ""}
              </p>
              {item.description ? (
                <p className="mt-3 line-clamp-2 text-sm text-muted">{item.description}</p>
              ) : null}

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <Badge variant="outline">{item.participantCount} peserta</Badge>
                <Link href={`/agenda/${item.id}`}>
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
            title="Belum ada agenda"
            description="Buat agenda kegiatan pertama organisasi Anda."
            action={
              <Button onClick={() => setIsModalOpen(true)}>
                <PlusIcon className="h-4 w-4" />
                Buat Agenda
              </Button>
            }
          />
        </Card>
      )}

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Agenda Baru"
        description="Lengkapi detail agenda dan undang peserta."
        maxWidth="large"
      >
        <div className="flex flex-col gap-5">
          <Input
            id="agenda-title"
            label="Judul Agenda"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="mis. Pelantikan Pengurus Baru"
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              id="agenda-start"
              label="Mulai"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              id="agenda-end"
              label="Selesai (opsional)"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Input
            id="agenda-location"
            label="Lokasi (opsional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="mis. Aula Sekolah"
          />
          <Textarea
            id="agenda-description"
            label="Deskripsi (opsional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi singkat agenda..."
            rows={3}
          />
          <Select id="agenda-status" label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Terbit</option>
            <option value="SELESAI">Selesai</option>
            <option value="BATAL">Batal</option>
          </Select>

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
              Buat Agenda
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

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
  listWorkProgramsAction,
  createWorkProgramAction,
  deleteWorkProgramAction,
  type WorkProgramItem,
} from "@/lib/work-programs-actions";
import { listAllMembersAction, type MemberListItem } from "@/lib/members-actions";
import { listSekbidAction, type SekbidItem } from "@/lib/sekbid-actions";
import { ChartIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import type { WorkProgramStatus } from "@/lib/generated/prisma/enums";

const statusLabel: Record<string, string> = {
  PLANNING: "Perencanaan",
  IN_PROGRESS: "Berjalan",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

const statusVariant: Record<string, "neutral" | "primary" | "success" | "danger" | "warning"> = {
  PLANNING: "neutral",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "danger",
};

export default function WorkProgramsPage() {
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState<WorkProgramItem[]>([]);
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [sekbids, setSekbids] = useState<SekbidItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sekbidId, setSekbidId] = useState("");
  const [picId, setPicId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [target, setTarget] = useState("");
  const [status, setStatus] = useState("PLANNING");

  const [itemToDelete, setItemToDelete] = useState<WorkProgramItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = () => {
    Promise.all([listWorkProgramsAction(), listAllMembersAction(), listSekbidAction()])
      .then(([programsResult, membersResult, sekbidsResult]) => {
        setItems(programsResult);
        setMembers(membersResult);
        setSekbids(sekbidsResult);
      })
      .catch((error) => {
        showError(error instanceof Error ? error.message : "Gagal memuat program kerja.");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      showError("Nama program kerja wajib diisi.");
      return;
    }
    setIsSubmitting(true);
    const result = await createWorkProgramAction({
      name: name.trim(),
      description: description.trim() || null,
      sekbidId: sekbidId || null,
      picId: picId || null,
      startDate: startDate || null,
      endDate: endDate || null,
      target: target.trim() || null,
      status: status as WorkProgramStatus,
    });
    setIsSubmitting(false);
    if ("error" in result) {
      showError(result.error);
      return;
    }
    showSuccess("Program kerja berhasil dibuat.");
    setIsModalOpen(false);
    setName("");
    setDescription("");
    setSekbidId("");
    setPicId("");
    setStartDate("");
    setEndDate("");
    setTarget("");
    setStatus("PLANNING");
    load();
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    const result = await deleteWorkProgramAction(itemToDelete.id);
    setIsDeleting(false);
    if ("error" in result) {
      showError(result.error);
      return;
    }
    showSuccess(`Program kerja "${itemToDelete.name}" dihapus.`);
    setItemToDelete(null);
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
        title="Program Kerja"
        description="Pantau progres program kerja setiap sekbid."
        action={
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Buat Program Kerja
          </Button>
        }
      />

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id} className="flex flex-col p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-soft text-primary">
                  <ChartIcon className="h-5 w-5" />
                </span>
                <div className="flex items-center gap-1">
                  <Badge variant={statusVariant[item.status] ?? "neutral"}>
                    {statusLabel[item.status] ?? item.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="small"
                    aria-label={`Hapus program kerja ${item.name}`}
                    className="text-danger hover:bg-danger-soft hover:text-danger"
                    onClick={() => setItemToDelete(item)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <h2 className="text-base font-semibold text-foreground">{item.name}</h2>
              <p className="mt-1 text-sm text-muted">
                {item.sekbidName ?? "Tanpa sekbid"}
                {item.picName ? ` · PIC: ${item.picName}` : ""}
              </p>
              {item.description ? (
                <p className="mt-2 line-clamp-2 text-sm text-muted">{item.description}</p>
              ) : null}

              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted">Progres</span>
                  <span className="font-medium text-foreground">{item.progressPercentage}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, item.progressPercentage))}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <Badge variant="outline">{item.taskCount} tugas</Badge>
                <Link href={`/proker/${item.id}`}>
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
            icon={<ChartIcon className="h-6 w-6" />}
            title="Belum ada program kerja"
            description="Buat program kerja pertama untuk memantau progres."
            action={
              <Button onClick={() => setIsModalOpen(true)}>
                <PlusIcon className="h-4 w-4" />
                Buat Program Kerja
              </Button>
            }
          />
        </Card>
      )}

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Program Kerja"
        description="Atur program kerja beserta sekbid dan penanggung jawab."
        maxWidth="large"
      >
        <div className="flex flex-col gap-5">
          <Input
            id="program-name"
            label="Nama Program Kerja"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="mis. Pekan Olahraga OSIS"
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Select id="program-sekbid" label="Sekbid (opsional)" value={sekbidId} onChange={(e) => setSekbidId(e.target.value)}>
              <option value="">— Pilih Sekbid —</option>
              {sekbids.map((sekbid) => (
                <option key={sekbid.id} value={sekbid.id}>
                  {sekbid.name}
                </option>
              ))}
            </Select>
            <Select id="program-pic" label="PIC (opsional)" value={picId} onChange={(e) => setPicId(e.target.value)}>
              <option value="">— Pilih PIC —</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input id="program-start" label="Mulai (opsional)" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="dd/mm/yyyy" />
            <Input id="program-end" label="Selesai (opsional)" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="dd/mm/yyyy" />
          </div>
          <Input
            id="program-target"
            label="Target (opsional)"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="mis. 50 peserta, 3 hari"
          />
          <Select id="program-status" label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="PLANNING">Perencanaan</option>
            <option value="IN_PROGRESS">Berjalan</option>
            <option value="COMPLETED">Selesai</option>
            <option value="CANCELLED">Dibatalkan</option>
          </Select>
          <Textarea
            id="program-description"
            label="Deskripsi (opsional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi singkat program kerja..."
            rows={3}
          />

          <div className="mt-2 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreate} isLoading={isSubmitting}>
              Buat Program Kerja
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={itemToDelete !== null}
        title="Hapus Program Kerja"
        message={
          itemToDelete ? `Anda yakin ingin menghapus program kerja "${itemToDelete.name}"?` : ""
        }
        confirmLabel="Hapus Program Kerja"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
}

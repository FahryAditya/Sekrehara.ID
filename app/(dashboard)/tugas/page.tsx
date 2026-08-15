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
  listTasksAction,
  createTaskAction,
  deleteTaskAction,
  type TaskItem,
  type TaskListResult,
} from "@/lib/tasks-actions";
import { listAllMembersAction, type MemberListItem } from "@/lib/members-actions";
import { TaskIcon, PlusIcon, TrashIcon, SearchIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/format";
import type { Priority } from "@/lib/generated/prisma/enums";

const statusLabel: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "Berjalan",
  REVIEW: "Review",
  DONE: "Selesai",
  CANCELLED: "Dibatalkan",
};

const statusVariant: Record<string, "neutral" | "primary" | "success" | "danger" | "warning"> = {
  TODO: "neutral",
  IN_PROGRESS: "warning",
  REVIEW: "primary",
  DONE: "success",
  CANCELLED: "danger",
};

const priorityLabel: Record<string, string> = {
  LOW: "Rendah",
  MEDIUM: "Sedang",
  HIGH: "Tinggi",
  CRITICAL: "Kritis",
};

const priorityVariant: Record<string, "neutral" | "primary" | "success" | "danger" | "warning"> = {
  LOW: "neutral",
  MEDIUM: "primary",
  HIGH: "warning",
  CRITICAL: "danger",
};

export default function TasksPage() {
  const { showSuccess, showError } = useToast();
  const [result, setResult] = useState<TaskListResult | null>(null);
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [deadline, setDeadline] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = (nextPage = page) => {
    listTasksAction({
      page: nextPage,
      pageSize: 10,
      status: statusFilter,
      priority: priorityFilter,
      search: search.trim() || undefined,
    })
      .then((taskResult) => setResult(taskResult))
      .catch((error) => {
        showError(error instanceof Error ? error.message : "Gagal memuat tugas.");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load(1);
    listAllMembersAction()
      .then(setMembers)
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter]);

  const handleSearch = () => {
    load(1);
    setPage(1);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      showError("Judul tugas wajib diisi.");
      return;
    }
    setIsSubmitting(true);
    const taskResult = await createTaskAction({
      title: title.trim(),
      description: description.trim() || null,
      priority: priority as Priority,
      deadline: deadline || null,
      assignedTo: assignedTo || null,
    });
    setIsSubmitting(false);
    if ("error" in taskResult) {
      showError(taskResult.error);
      return;
    }
    showSuccess("Tugas berhasil dibuat.");
    setIsModalOpen(false);
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setDeadline("");
    setAssignedTo("");
    load(1);
    setPage(1);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    const taskResult = await deleteTaskAction(taskToDelete.id);
    setIsDeleting(false);
    if ("error" in taskResult) {
      showError(taskResult.error);
      return;
    }
    showSuccess(`Tugas "${taskToDelete.title}" dihapus.`);
    setTaskToDelete(null);
    load();
  };

  if (isLoading && !result) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-primary">
        <Spinner size="large" />
      </div>
    );
  }

  const tasks = result?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Tugas"
        description="Kelola tugas dan pekerjaan organisasi."
        action={
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Buat Tugas
          </Button>
        }
      />

      <Card className="mb-5 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              id="task-search"
              placeholder="Cari judul tugas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              className="pl-9"
            />
          </div>
          <Select id="task-status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">Semua Status</option>
            {Object.entries(statusLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select id="task-priority-filter" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="ALL">Semua Prioritas</option>
            {Object.entries(priorityLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Button variant="secondary" onClick={handleSearch}>
            <SearchIcon className="h-4 w-4" />
            Cari
          </Button>
        </div>
      </Card>

      {tasks.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {tasks.map((task) => (
            <Card key={task.id} className="flex flex-col p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-soft text-primary">
                  <TaskIcon className="h-5 w-5" />
                </span>
                <div className="flex items-center gap-1">
                  <Badge variant={priorityVariant[task.priority] ?? "neutral"}>
                    {priorityLabel[task.priority] ?? task.priority}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="small"
                    aria-label={`Hapus tugas ${task.title}`}
                    className="text-danger hover:bg-danger-soft hover:text-danger"
                    onClick={() => setTaskToDelete(task)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <h2 className="text-base font-semibold text-foreground">{task.title}</h2>
              <p className="mt-1 text-sm text-muted">
                {task.assignedToName ? `PJ: ${task.assignedToName}` : "Belum ada penanggung jawab"}
              </p>
              {task.deadline ? (
                <p className="mt-1 text-xs text-muted">Tenggat: {formatDate(task.deadline)}</p>
              ) : null}
              {task.description ? (
                <p className="mt-3 line-clamp-2 text-sm text-muted">{task.description}</p>
              ) : null}

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <Badge variant={statusVariant[task.status] ?? "neutral"}>
                  {statusLabel[task.status] ?? task.status}
                </Badge>
                <Link href={`/tugas/${task.id}`}>
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
            icon={<TaskIcon className="h-6 w-6" />}
            title="Belum ada tugas"
            description="Buat tugas pertama untuk memulai."
            action={
              <Button onClick={() => setIsModalOpen(true)}>
                <PlusIcon className="h-4 w-4" />
                Buat Tugas
              </Button>
            }
          />
        </Card>
      )}

      {result && result.totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted">
            Menampilkan {result.total} tugas
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="small"
              disabled={page <= 1}
              onClick={() => {
                const next = Math.max(1, page - 1);
                setPage(next);
                load(next);
              }}
            >
              Sebelumnya
            </Button>
            <Button
              variant="secondary"
              size="small"
              disabled={page >= result.totalPages}
              onClick={() => {
                const next = Math.min(result.totalPages, page + 1);
                setPage(next);
                load(next);
              }}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      ) : null}

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Tugas Baru"
        description="Atur judul, prioritas, tenggat, dan penanggung jawab tugas."
        maxWidth="large"
      >
        <div className="flex flex-col gap-5">
          <Input
            id="task-title"
            label="Judul Tugas"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="mis. Persiapan laporan bulanan"
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Select id="task-priority" label="Prioritas" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="LOW">Rendah</option>
              <option value="MEDIUM">Sedang</option>
              <option value="HIGH">Tinggi</option>
              <option value="CRITICAL">Kritis</option>
            </Select>
            <Input
              id="task-deadline"
              label="Tenggat (opsional)"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <Select id="task-assignee" label="Penanggung Jawab (opsional)" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">— Pilih Anggota —</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
          <Textarea
            id="task-description"
            label="Deskripsi (opsional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />

          <div className="mt-2 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreate} isLoading={isSubmitting}>
              Buat Tugas
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={taskToDelete !== null}
        title="Hapus Tugas"
        message={
          taskToDelete ? `Anda yakin ingin menghapus tugas "${taskToDelete.title}"?` : ""
        }
        confirmLabel="Hapus Tugas"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
}

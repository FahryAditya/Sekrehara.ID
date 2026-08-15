"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import {
  getTaskAction,
  updateTaskStatusAction,
  addTaskCommentAction,
  deleteTaskCommentAction,
  type TaskDetail,
} from "@/lib/tasks-actions";
import { ChevronLeftIcon, TaskIcon } from "@/components/ui/icons";
import { formatDateTime } from "@/lib/format";
import type { TaskStatus } from "@/lib/generated/prisma/enums";

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

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const { showSuccess, showError } = useToast();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTaskAction(params.id)
      .then((result) => {
        if (cancelled) return;
        setTask(result);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const reload = async () => {
    setTask(await getTaskAction(params.id));
  };

  const handleStatusChange = async (status: TaskStatus) => {
    setIsSubmittingStatus(true);
    const result = await updateTaskStatusAction(params.id, status);
    setIsSubmittingStatus(false);
    if ("error" in result) {
      showError(result.error);
      return;
    }
    showSuccess("Status tugas diperbarui.");
    await reload();
  };

  const handleAddComment = async () => {
    if (!commentContent.trim()) {
      showError("Komentar tidak boleh kosong.");
      return;
    }
    const result = await addTaskCommentAction({ taskId: params.id, content: commentContent });
    if ("error" in result) {
      showError(result.error);
      return;
    }
    setCommentContent("");
    await reload();
  };

  const handleDeleteComment = async (commentId: string) => {
    const result = await deleteTaskCommentAction(commentId);
    if ("error" in result) {
      showError(result.error);
      return;
    }
    await reload();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-primary">
        <Spinner size="large" />
      </div>
    );
  }

  if (!task) {
    return (
      <div>
        <PageHeader title="Tugas" description="Tugas tidak ditemukan." />
        <Card>
          <EmptyState
            icon={<TaskIcon className="h-6 w-6" />}
            title="Tugas tidak ditemukan"
            description="Tugas yang Anda cari mungkin telah dihapus."
            action={
              <Link href="/tugas">
                <Button variant="secondary">
                  <ChevronLeftIcon className="h-4 w-4" />
                  Kembali ke Tugas
                </Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/tugas"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-primary"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Kembali ke Tugas
      </Link>

      <PageHeader
        title={task.title}
        description={`Dibuat ${formatDateTime(task.createdAt)}`}
        action={
          <Select
            id="task-status"
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
            disabled={isSubmittingStatus}
            className="h-9 w-40"
          >
            {Object.entries(statusLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader title="Deskripsi" />
            <CardBody>
              {task.description ? (
                <p className="whitespace-pre-line text-sm leading-6 text-muted">{task.description}</p>
              ) : (
                <p className="text-sm text-muted">Tidak ada deskripsi.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Komentar" subtitle={`${task.comments.length} komentar`} />
            <CardBody className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Textarea
                  id="task-comment"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  rows={3}
                  placeholder="Tulis komentar..."
                />
                <div className="flex justify-end">
                  <Button size="small" variant="secondary" onClick={handleAddComment}>
                    Kirim Komentar
                  </Button>
                </div>
              </div>
              {task.comments.length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {task.comments.map((comment) => (
                    <li key={comment.id} className="rounded-md border border-border bg-background px-4 py-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">
                          {comment.userName ?? "Pengguna"}
                        </span>
                        <span className="text-xs text-muted">{formatDateTime(comment.createdAt)}</span>
                      </div>
                      <p className="whitespace-pre-line text-sm leading-6 text-muted">{comment.content}</p>
                      <div className="mt-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="small"
                          className="text-danger"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">Belum ada komentar.</p>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Detail" />
            <CardBody className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Prioritas</span>
                <Badge variant={priorityVariant[task.priority] ?? "neutral"}>
                  {priorityLabel[task.priority] ?? task.priority}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Status</span>
                <Badge variant={statusVariant[task.status] ?? "neutral"}>
                  {statusLabel[task.status] ?? task.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Penanggung jawab</span>
                <span className="text-sm font-medium text-foreground">
                  {task.assignedToName ?? "Belum ditentukan"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Tenggat</span>
                <span className="text-sm font-medium text-foreground">
                  {task.deadline ? formatDateTime(task.deadline) : "Tidak ada"}
                </span>
              </div>
            </CardBody>
          </Card>

          {task.attachments.length > 0 ? (
            <Card>
              <CardHeader title="Lampiran" subtitle={`${task.attachments.length} file`} />
              <CardBody>
                <ul className="flex flex-col gap-2">
                  {task.attachments.map((attachment) => (
                    <li key={attachment.id}>
                      <a
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        {attachment.fileName}
                      </a>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

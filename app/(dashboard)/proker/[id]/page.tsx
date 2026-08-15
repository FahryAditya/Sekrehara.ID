"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import {
  getWorkProgramAction,
  updateWorkProgramProgressAction,
  type WorkProgramDetail,
} from "@/lib/work-programs-actions";
import { ChevronLeftIcon, ChartIcon } from "@/components/ui/icons";
import { formatDate, formatDateTime } from "@/lib/format";

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

export default function WorkProgramDetailPage() {
  const params = useParams<{ id: string }>();
  const { showSuccess, showError } = useToast();
  const [program, setProgram] = useState<WorkProgramDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [progressValue, setProgressValue] = useState(0);
  const [progressDescription, setProgressDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getWorkProgramAction(params.id)
      .then((result) => {
        if (cancelled) return;
        setProgram(result);
        if (result) setProgressValue(result.progressPercentage);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const handleUpdateProgress = async () => {
    setIsSubmitting(true);
    const result = await updateWorkProgramProgressAction(params.id, {
      progressPercentage: progressValue,
      description: progressDescription.trim() || null,
    });
    setIsSubmitting(false);
    if ("error" in result) {
      showError(result.error);
      return;
    }
    showSuccess("Progres diperbarui.");
    setProgressDescription("");
    setProgram(await getWorkProgramAction(params.id));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-primary">
        <Spinner size="large" />
      </div>
    );
  }

  if (!program) {
    return (
      <div>
        <PageHeader title="Program Kerja" description="Program kerja tidak ditemukan." />
        <Card>
          <EmptyState
            icon={<ChartIcon className="h-6 w-6" />}
            title="Program kerja tidak ditemukan"
            description="Program kerja yang Anda cari mungkin telah dihapus."
            action={
              <Link href="/proker">
                <Button variant="secondary">
                  <ChevronLeftIcon className="h-4 w-4" />
                  Kembali ke Program Kerja
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
        href="/proker"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-primary"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Kembali ke Program Kerja
      </Link>

      <PageHeader
        title={program.name}
        description={`${program.sekbidName ?? "Tanpa sekbid"}${program.picName ? ` · PIC: ${program.picName}` : ""}`}
        action={<Badge variant={statusVariant[program.status] ?? "neutral"}>{statusLabel[program.status] ?? program.status}</Badge>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {program.description ? (
            <Card>
              <CardHeader title="Deskripsi" />
              <CardBody>
                <p className="whitespace-pre-line text-sm leading-6 text-muted">{program.description}</p>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader
              title="Perbarui Progres"
              subtitle="Catat perkembangan program kerja"
            />
            <CardBody className="flex flex-col gap-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-muted">Progres</span>
                  <span className="font-medium text-foreground">{progressValue}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={progressValue}
                  onChange={(e) => setProgressValue(Number(e.target.value))}
                  className="w-full accent-primary"
                  aria-label="Persentase progres"
                />
              </div>
              <Textarea
                id="progress-description"
                value={progressDescription}
                onChange={(e) => setProgressDescription(e.target.value)}
                rows={2}
                placeholder="Catatan perkembangan (opsional)..."
              />
              <div className="flex justify-end">
                <Button onClick={handleUpdateProgress} isLoading={isSubmitting}>
                  Simpan Progres
                </Button>
              </div>
            </CardBody>
          </Card>

          {program.tasks.length > 0 ? (
            <Card>
              <CardHeader title="Tugas Terkait" subtitle={`${program.tasks.length} tugas`} />
              <CardBody>
                <ul className="flex flex-col gap-2">
                  {program.tasks.map((task) => (
                    <li key={task.id}>
                      <Link
                        href={`/tugas/${task.id}`}
                        className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        <span className="truncate">{task.title}</span>
                        <Badge variant="neutral">{task.status}</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : null}

          {program.updates.length > 0 ? (
            <Card>
              <CardHeader title="Riwayat Progres" subtitle={`${program.updates.length} pembaruan`} />
              <CardBody>
                <ul className="flex flex-col gap-3">
                  {program.updates.map((update) => (
                    <li key={update.id} className="rounded-md border border-border bg-background px-4 py-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{update.progressPercentage}%</span>
                        <span className="text-xs text-muted">{formatDateTime(update.createdAt)}</span>
                      </div>
                      {update.description ? (
                        <p className="text-sm leading-6 text-muted">{update.description}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Informasi" />
            <CardBody className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Status</span>
                <Badge variant={statusVariant[program.status] ?? "neutral"}>
                  {statusLabel[program.status] ?? program.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Progres</span>
                <span className="text-sm font-medium text-foreground">{program.progressPercentage}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Sekbid</span>
                <span className="text-sm font-medium text-foreground">{program.sekbidName ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">PIC</span>
                <span className="text-sm font-medium text-foreground">{program.picName ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Mulai</span>
                <span className="text-sm font-medium text-foreground">
                  {program.startDate ? formatDate(program.startDate) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Selesai</span>
                <span className="text-sm font-medium text-foreground">
                  {program.endDate ? formatDate(program.endDate) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Target</span>
                <span className="text-sm font-medium text-foreground">{program.target ?? "—"}</span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

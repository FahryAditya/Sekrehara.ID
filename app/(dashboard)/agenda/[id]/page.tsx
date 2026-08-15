"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import {
  getAgendaAction,
  updateRsvpAction,
  type AgendaDetail,
} from "@/lib/agenda-actions";
import { getMyMemberAction } from "@/lib/members-actions";
import { ChevronLeftIcon, CalendarIcon } from "@/components/ui/icons";
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

const rsvpLabel: Record<string, string> = {
  PENDING: "Belum konfirmasi",
  AKAN_HADIR: "Akan hadir",
  TIDAK_HADIR: "Tidak hadir",
};

const rsvpVariant: Record<string, "neutral" | "success" | "danger"> = {
  PENDING: "neutral",
  AKAN_HADIR: "success",
  TIDAK_HADIR: "danger",
};

export default function AgendaDetailPage() {
  const params = useParams<{ id: string }>();
  const { showSuccess, showError } = useToast();
  const [agenda, setAgenda] = useState<AgendaDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [myMemberId, setMyMemberId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAgendaAction(params.id), getMyMemberAction()])
      .then(([agendaResult, memberResult]) => {
        if (cancelled) return;
        setAgenda(agendaResult);
        setMyMemberId(memberResult?.id ?? null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const handleRsvp = async (status: "AKAN_HADIR" | "TIDAK_HADIR") => {
    if (!myMemberId) return;
    const result = await updateRsvpAction(params.id, status);
    if ("error" in result) {
      showError(result.error);
      return;
    }
    showSuccess("Status kehadiran diperbarui.");
    const refreshed = await getAgendaAction(params.id);
    if (refreshed) setAgenda(refreshed);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-primary">
        <Spinner size="large" />
      </div>
    );
  }

  if (!agenda) {
    return (
      <div>
        <PageHeader title="Agenda" description="Agenda tidak ditemukan." />
        <Card>
          <EmptyState
            icon={<CalendarIcon className="h-6 w-6" />}
            title="Agenda tidak ditemukan"
            description="Agenda yang Anda cari mungkin telah dihapus."
            action={
              <Link href="/agenda">
                <Button variant="secondary">
                  <ChevronLeftIcon className="h-4 w-4" />
                  Kembali ke Agenda
                </Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  const myParticipation = agenda.participants.find((p) => p.memberId === myMemberId);

  return (
    <div>
      <Link
        href="/agenda"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-primary"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Kembali ke Agenda
      </Link>

      <PageHeader
        title={agenda.title}
        description={`${formatDateTime(agenda.startDate)}${agenda.location ? ` · ${agenda.location}` : ""}`}
        action={<Badge variant={statusVariant[agenda.status] ?? "neutral"}>{statusLabel[agenda.status] ?? agenda.status}</Badge>}
      />

      {agenda.description ? (
        <Card className="mb-6 p-6">
          <p className="whitespace-pre-line text-sm leading-6 text-muted">{agenda.description}</p>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="Daftar Peserta"
          subtitle={`${agenda.participants.length} peserta diundang`}
        />
        {agenda.participants.length > 0 ? (
          <ul className="divide-y divide-border">
            {agenda.participants.map((participant) => (
              <li key={participant.memberId} className="flex items-center justify-between px-6 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-sm font-medium text-muted">
                    {participant.memberName.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate text-sm font-medium text-foreground">
                    {participant.memberName}
                  </span>
                </div>
                <Badge variant={rsvpVariant[participant.rsvpStatus] ?? "neutral"}>
                  {rsvpLabel[participant.rsvpStatus] ?? participant.rsvpStatus}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<CalendarIcon className="h-6 w-6" />}
            title="Belum ada peserta"
            description="Belum ada anggota yang diundang ke agenda ini."
          />
        )}
      </Card>

      {myParticipation ? (
        <Card className="mt-6 p-6">
          <h2 className="text-base font-semibold text-foreground">Konfirmasi Kehadiran Anda</h2>
          <p className="mt-1 text-sm text-muted">
            Status Anda saat ini:{" "}
            <Badge variant={rsvpVariant[myParticipation.rsvpStatus] ?? "neutral"}>
              {rsvpLabel[myParticipation.rsvpStatus] ?? myParticipation.rsvpStatus}
            </Badge>
          </p>
          <div className="mt-4 flex gap-3">
            <Button variant={myParticipation.rsvpStatus === "AKAN_HADIR" ? "primary" : "secondary"} onClick={() => handleRsvp("AKAN_HADIR")}>
              Akan Hadir
            </Button>
            <Button variant={myParticipation.rsvpStatus === "TIDAK_HADIR" ? "danger" : "secondary"} onClick={() => handleRsvp("TIDAK_HADIR")}>
              Tidak Hadir
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

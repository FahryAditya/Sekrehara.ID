"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useDataStore } from "@/lib/data-store";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { ChevronLeftIcon, ClipboardCheckIcon, UsersIcon } from "@/components/ui/icons";
import { formatDate, formatPercent } from "@/lib/format";
import { combineClassNames } from "@/lib/utils";
import type { AttendanceStatus } from "@/lib/types";

type AttendanceSheetProps = {
  eventId: string;
};

const statusOptions: Array<{
  value: AttendanceStatus;
  label: string;
  activeClassName: string;
  idleClassName: string;
}> = [
  {
    value: "HADIR",
    label: "Hadir",
    activeClassName: "bg-success text-white",
    idleClassName: "hover:bg-success-soft hover:text-success",
  },
  {
    value: "IZIN",
    label: "Izin",
    activeClassName: "bg-warning text-white",
    idleClassName: "hover:bg-warning-soft hover:text-warning",
  },
  {
    value: "ALPA",
    label: "Alpa",
    activeClassName: "bg-danger text-white",
    idleClassName: "hover:bg-danger-soft hover:text-danger",
  },
];

export function AttendanceSheet({ eventId }: AttendanceSheetProps) {
  const { events, participants, attendance, setAttendanceStatus } = useDataStore();
  const { showSuccess, showError } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AttendanceStatus | "SEMUA">("SEMUA");

  const event = events.find((item) => item.id === eventId);

  const filteredParticipants = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return participants.filter((participant) => {
      const matchesQuery =
        !normalizedQuery ||
        participant.name.toLowerCase().includes(normalizedQuery) ||
        (participant.email ?? "").toLowerCase().includes(normalizedQuery);
      const status = attendance[eventId]?.[participant.id];
      const matchesFilter = statusFilter === "SEMUA" || status === statusFilter;
      return matchesQuery && matchesFilter;
    });
  }, [participants, attendance, eventId, searchQuery, statusFilter]);

  if (!event) {
    return (
      <div>
        <PageHeader title="Presensi Kegiatan" description="Kegiatan tidak ditemukan." />
        <Card>
          <EmptyState
            icon={<ClipboardCheckIcon className="h-6 w-6" />}
            title="Kegiatan tidak ditemukan"
            description="Kegiatan yang Anda cari mungkin telah dihapus."
            action={
              <Link href="/presensi">
                <Button variant="secondary">
                  <ChevronLeftIcon className="h-4 w-4" />
                  Kembali ke Daftar Kegiatan
                </Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  const records = attendance[eventId] ?? {};
  const recordedCount = Object.keys(records).length;
  const hadirCount = Object.values(records).filter((status) => status === "HADIR").length;
  const izinCount = Object.values(records).filter((status) => status === "IZIN").length;
  const alpaCount = Object.values(records).filter((status) => status === "ALPA").length;

  const statusSummary = [
    { status: "HADIR" as AttendanceStatus, count: hadirCount, className: "bg-success" },
    { status: "IZIN" as AttendanceStatus, count: izinCount, className: "bg-warning" },
    { status: "ALPA" as AttendanceStatus, count: alpaCount, className: "bg-danger" },
  ];

  const handleSetStatus = async (participantId: string, status: AttendanceStatus) => {
    const result = await setAttendanceStatus(eventId, participantId, status);
    if (!result.ok) {
      showError("Gagal memperbarui kehadiran: " + (result.error ?? ""));
      return;
    }
    const participant = participants.find((item) => item.id === participantId);
    const statusLabel = statusOptions.find((option) => option.value === status)?.label;
    if (participant) {
      showSuccess(`Status "${participant.name}" diubah menjadi ${statusLabel}.`);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/presensi"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-primary"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Kembali ke Daftar Kegiatan
        </Link>
        <PageHeader
          title={event.name}
          description={`${formatDate(event.date)} · ${participants.length} peserta terdaftar`}
        />
      </div>

      {/* Ringkasan kehadiran */}
      <Card className="mb-6 p-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {statusSummary.map((summary) => (
            <div key={summary.status} className="flex items-center gap-3">
              <span className={combineClassNames("h-10 w-1.5 rounded-full", summary.className)} />
              <div className="flex flex-col">
                <span className="text-sm text-muted">
                  {statusOptions.find((option) => option.value === summary.status)?.label}
                </span>
                <span className="text-lg font-semibold text-foreground">
                  {summary.count} <span className="text-sm font-normal text-muted">peserta</span>
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted">
              {recordedCount > 0
                ? `${formatPercent(hadirCount, recordedCount)} kehadiran dari ${recordedCount} peserta yang tercatat`
                : "Belum ada peserta yang dicatat"}
            </span>
            <span className="text-sm font-medium text-foreground">
              Persentase Hadir: {formatPercent(hadirCount, participants.length)}
            </span>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-background"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round((hadirCount / participants.length) * 100)}
          >
            <div
              className="h-full rounded-full bg-success transition-all duration-500 ease-smooth"
              style={{ width: `${participants.length > 0 ? (hadirCount / participants.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Toolbar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-sm">
          <SearchInput
            id="attendance-search"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Cari nama atau email peserta..."
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterButton label="Semua" isActive={statusFilter === "SEMUA"} onClick={() => setStatusFilter("SEMUA")} />
          {statusOptions.map((option) => (
            <FilterButton
              key={option.value}
              label={option.label}
              isActive={statusFilter === option.value}
              onClick={() => setStatusFilter(option.value)}
            />
          ))}
        </div>
      </div>

      <Card>
        {filteredParticipants.length > 0 ? (
          <ul className="divide-y divide-border">
            {filteredParticipants.map((participant) => {
              const currentStatus = records[participant.id];
              return (
                <li
                  key={participant.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-sm font-medium text-muted">
                      {participant.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-foreground">
                        {participant.name}
                      </span>
                      <span className="truncate text-xs text-muted">{participant.email}</span>
                    </div>
                  </div>

                  <div
                    className="flex rounded-md border border-border p-0.5"
                    role="group"
                    aria-label={`Status kehadiran ${participant.name}`}
                  >
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={currentStatus === option.value}
                        onClick={() => handleSetStatus(participant.id, option.value)}
                        className={combineClassNames(
                          "flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.97]",
                          currentStatus === option.value
                            ? combineClassNames("animate-pop", option.activeClassName)
                            : combineClassNames("text-muted", option.idleClassName)
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={<UsersIcon className="h-6 w-6" />}
            title={searchQuery || statusFilter !== "SEMUA" ? "Tidak ada hasil" : "Belum ada peserta"}
            description={
              searchQuery || statusFilter !== "SEMUA"
                ? "Coba ubah kata kunci atau filter status."
                : "Tambahkan peserta terlebih dahulu untuk mencatat kehadiran."
            }
          />
        )}
      </Card>
    </div>
  );
}

function FilterButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={combineClassNames(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        isActive ? "bg-primary text-white" : "bg-surface text-muted hover:bg-background"
      )}
    >
      {label}
    </button>
  );
}
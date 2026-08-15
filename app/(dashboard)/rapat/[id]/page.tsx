"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import {
  getMeetingAction,
  saveMeetingAttendanceAction,
  addMeetingNoteAction,
  deleteMeetingNoteAction,
  addMeetingDecisionAction,
  deleteMeetingDecisionAction,
  addActionItemAction,
  updateActionItemAction,
  type MeetingDetail,
} from "@/lib/meetings-actions";
import { listAllMembersAction, type MemberListItem } from "@/lib/members-actions";
import { ChevronLeftIcon, CalendarIcon } from "@/components/ui/icons";
import { formatDateTime } from "@/lib/format";
import { combineClassNames } from "@/lib/utils";
import type { MeetingAttendanceStatus, ActionItemStatus } from "@/lib/generated/prisma/enums";

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

const attendanceOptions: Array<{ value: MeetingAttendanceStatus; label: string; className: string }> = [
  { value: "HADIR", label: "Hadir", className: "bg-success text-white" },
  { value: "IZIN", label: "Izin", className: "bg-warning text-white" },
  { value: "SAKIT", label: "Sakit", className: "bg-warning text-white" },
  { value: "ALPHA", label: "Alpa", className: "bg-danger text-white" },
];

const actionItemVariant: Record<string, "neutral" | "primary" | "success" | "danger" | "warning"> = {
  OPEN: "neutral",
  IN_PROGRESS: "warning",
  DONE: "success",
};

export default function MeetingDetailPage() {
  const params = useParams<{ id: string }>();
  const { showSuccess, showError } = useToast();
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [attendanceMap, setAttendanceMap] = useState<Record<string, MeetingAttendanceStatus>>({});
  const [noteContent, setNoteContent] = useState("");
  const [decisionContent, setDecisionContent] = useState("");
  const [actionDescription, setActionDescription] = useState("");
  const [actionAssignee, setActionAssignee] = useState("");
  const [actionDeadline, setActionDeadline] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMeetingAction(params.id), listAllMembersAction()])
      .then(([meetingResult, membersResult]) => {
        if (cancelled) return;
        setMeeting(meetingResult);
        setMembers(membersResult);
        if (meetingResult) {
          const map: Record<string, MeetingAttendanceStatus> = {};
          for (const record of meetingResult.attendance) {
            map[record.memberId] = record.status;
          }
          setAttendanceMap(map);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const reload = async () => {
    const result = await getMeetingAction(params.id);
    setMeeting(result);
    if (result) {
      const map: Record<string, MeetingAttendanceStatus> = {};
      for (const record of result.attendance) {
        map[record.memberId] = record.status;
      }
      setAttendanceMap(map);
    }
  };

  const handleSaveAttendance = async () => {
    if (!meeting) return;
    setIsSubmitting(true);
    const records = meeting.participants.map((participant) => ({
      memberId: participant.memberId,
      status: attendanceMap[participant.memberId] ?? ("ALPHA" as MeetingAttendanceStatus),
    }));
    const result = await saveMeetingAttendanceAction({ meetingId: meeting.id, records });
    setIsSubmitting(false);
    if ("error" in result) {
      showError(result.error);
      return;
    }
    showSuccess("Absensi rapat disimpan.");
    await reload();
  };

  const handleAddNote = async () => {
    if (!meeting) return;
    if (!noteContent.trim()) {
      showError("Isi notulen tidak boleh kosong.");
      return;
    }
    const result = await addMeetingNoteAction({ meetingId: meeting.id, content: noteContent });
    if ("error" in result) {
      showError(result.error);
      return;
    }
    setNoteContent("");
    showSuccess("Notulen ditambahkan.");
    await reload();
  };

  const handleDeleteNote = async (noteId: string) => {
    const result = await deleteMeetingNoteAction(noteId);
    if ("error" in result) {
      showError(result.error);
      return;
    }
    await reload();
  };

  const handleAddDecision = async () => {
    if (!meeting) return;
    if (!decisionContent.trim()) {
      showError("Keputusan tidak boleh kosong.");
      return;
    }
    const result = await addMeetingDecisionAction({ meetingId: meeting.id, decision: decisionContent });
    if ("error" in result) {
      showError(result.error);
      return;
    }
    setDecisionContent("");
    showSuccess("Keputusan ditambahkan.");
    await reload();
  };

  const handleDeleteDecision = async (decisionId: string) => {
    const result = await deleteMeetingDecisionAction(decisionId);
    if ("error" in result) {
      showError(result.error);
      return;
    }
    await reload();
  };

  const handleAddActionItem = async () => {
    if (!meeting) return;
    if (!actionDescription.trim()) {
      showError("Deskripsi tindak lanjut wajib diisi.");
      return;
    }
    const result = await addActionItemAction({
      meetingId: meeting.id,
      description: actionDescription.trim(),
      assignedTo: actionAssignee || null,
      deadline: actionDeadline || null,
    });
    if ("error" in result) {
      showError(result.error);
      return;
    }
    setActionDescription("");
    setActionAssignee("");
    setActionDeadline("");
    showSuccess("Tindak lanjut ditambahkan.");
    await reload();
  };

  const handleUpdateActionStatus = async (actionItemId: string, status: ActionItemStatus) => {
    const result = await updateActionItemAction({ actionItemId, status });
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

  if (!meeting) {
    return (
      <div>
        <PageHeader title="Rapat" description="Rapat tidak ditemukan." />
        <Card>
          <EmptyState
            icon={<CalendarIcon className="h-6 w-6" />}
            title="Rapat tidak ditemukan"
            description="Rapat yang Anda cari mungkin telah dihapus."
            action={
              <Link href="/rapat">
                <Button variant="secondary">
                  <ChevronLeftIcon className="h-4 w-4" />
                  Kembali ke Rapat
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
        href="/rapat"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-primary"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Kembali ke Rapat
      </Link>

      <PageHeader
        title={meeting.title}
        description={`${formatDateTime(meeting.scheduledDate)}${meeting.location ? ` · ${meeting.location}` : ""}`}
        action={<Badge variant={statusVariant[meeting.status] ?? "neutral"}>{statusLabel[meeting.status] ?? meeting.status}</Badge>}
      />

      {meeting.description ? (
        <Card className="mb-6 p-6">
          <p className="whitespace-pre-line text-sm leading-6 text-muted">{meeting.description}</p>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Absensi */}
        <Card>
          <CardHeader
            title="Absensi Rapat"
            subtitle={`${meeting.participants.length} peserta diundang`}
            action={
              <Button size="small" onClick={handleSaveAttendance} isLoading={isSubmitting}>
                Simpan
              </Button>
            }
          />
          {meeting.participants.length > 0 ? (
            <ul className="divide-y divide-border">
              {meeting.participants.map((participant) => {
                const currentStatus = attendanceMap[participant.memberId];
                return (
                  <li key={participant.memberId} className="flex items-center justify-between gap-3 px-6 py-3">
                    <span className="truncate text-sm font-medium text-foreground">
                      {participant.memberName}
                    </span>
                    <div className="flex rounded-md border border-border p-0.5">
                      {attendanceOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={currentStatus === option.value}
                          onClick={() =>
                            setAttendanceMap((current) => ({
                              ...current,
                              [participant.memberId]: option.value,
                            }))
                          }
                          className={combineClassNames(
                            "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                            currentStatus === option.value
                              ? option.className
                              : "text-muted hover:bg-background"
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
              icon={<CalendarIcon className="h-6 w-6" />}
              title="Belum ada peserta"
              description="Belum ada anggota yang diundang ke rapat ini."
            />
          )}
        </Card>

        {/* Notulen */}
        <Card>
          <CardHeader title="Notulen" subtitle="Catatan jalannya rapat" />
          <CardBody className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Textarea
                id="meeting-note"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={3}
                placeholder="Tulis catatan notulen rapat..."
              />
              <div className="flex justify-end">
                <Button size="small" variant="secondary" onClick={handleAddNote}>
                  Tambah Notulen
                </Button>
              </div>
            </div>
            {meeting.notes.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {meeting.notes.map((note) => (
                  <li key={note.id} className="rounded-md border border-border bg-background px-4 py-3">
                    <p className="whitespace-pre-line text-sm leading-6 text-foreground">{note.content}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted">{formatDateTime(note.createdAt)}</span>
                      <Button variant="ghost" size="small" className="text-danger" onClick={() => handleDeleteNote(note.id)}>
                        Hapus
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Belum ada notulen.</p>
            )}
          </CardBody>
        </Card>

        {/* Keputusan */}
        <Card>
          <CardHeader title="Keputusan" subtitle="Hasil kesepakatan rapat" />
          <CardBody className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Textarea
                id="meeting-decision"
                value={decisionContent}
                onChange={(e) => setDecisionContent(e.target.value)}
                rows={2}
                placeholder="Tulis keputusan rapat..."
              />
              <div className="flex justify-end">
                <Button size="small" variant="secondary" onClick={handleAddDecision}>
                  Tambah Keputusan
                </Button>
              </div>
            </div>
            {meeting.decisions.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {meeting.decisions.map((decision) => (
                  <li key={decision.id} className="rounded-md border border-border bg-background px-4 py-3">
                    <p className="text-sm leading-6 text-foreground">{decision.decision}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted">{formatDateTime(decision.createdAt)}</span>
                      <Button variant="ghost" size="small" className="text-danger" onClick={() => handleDeleteDecision(decision.id)}>
                        Hapus
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Belum ada keputusan.</p>
            )}
          </CardBody>
        </Card>

        {/* Tindak lanjut */}
        <Card>
          <CardHeader title="Tindak Lanjut" subtitle="Pekerjaan lanjutan pasca rapat" />
          <CardBody className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 rounded-md border border-border p-3">
              <Textarea
                id="action-description"
                value={actionDescription}
                onChange={(e) => setActionDescription(e.target.value)}
                rows={2}
                placeholder="Deskripsi tindak lanjut..."
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Select id="action-assignee" value={actionAssignee} onChange={(e) => setActionAssignee(e.target.value)}>
                  <option value="">— Penanggung jawab —</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </Select>
                <Input id="action-deadline" type="date" value={actionDeadline} onChange={(e) => setActionDeadline(e.target.value)} />
              </div>
              <div className="flex justify-end">
                <Button size="small" variant="secondary" onClick={handleAddActionItem}>
                  Tambah
                </Button>
              </div>
            </div>
            {meeting.actionItems.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {meeting.actionItems.map((item) => (
                  <li key={item.id} className="rounded-md border border-border bg-background px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm leading-6 text-foreground">{item.description}</p>
                      <Badge variant={actionItemVariant[item.status] ?? "neutral"}>{item.status}</Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-col gap-0.5 text-xs text-muted">
                        {item.assignedToName ? <span>PJ: {item.assignedToName}</span> : null}
                        {item.deadline ? <span>Tenggat: {formatDateTime(item.deadline)}</span> : null}
                      </div>
                      <Select
                        id={`action-status-${item.id}`}
                        value={item.status}
                        onChange={(e) => handleUpdateActionStatus(item.id, e.target.value as ActionItemStatus)}
                        className="h-8 w-32 text-xs"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">Berjalan</option>
                        <option value="DONE">Selesai</option>
                      </Select>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Belum ada tindak lanjut.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  listLettersAction,
  createLetterAction,
  deleteLetterAction,
  approveLetterAction,
  rejectLetterAction,
  archiveLetterAction,
  type LetterItem,
  type LetterListResult,
} from "@/lib/letters-actions";
import { DocumentIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/format";
import type { LetterType } from "@/lib/generated/prisma/enums";

const typeLabel: Record<string, string> = {
  MASUK: "Surat Masuk",
  KELUAR: "Surat Keluar",
};

const statusLabel: Record<string, string> = {
  DRAFT: "Draft",
  REVIEW: "Review",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  ARCHIVED: "Diarsipkan",
};

const statusVariant: Record<string, "neutral" | "primary" | "success" | "danger" | "warning"> = {
  DRAFT: "neutral",
  REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  ARCHIVED: "primary",
};

export default function LettersPage() {
  const { showSuccess, showError } = useToast();
  const [result, setResult] = useState<LetterListResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [letterType, setLetterType] = useState<LetterType>("MASUK");
  const [date, setDate] = useState("");
  const [subject, setSubject] = useState("");
  const [sender, setSender] = useState("");
  const [recipient, setRecipient] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  const [letterToDelete, setLetterToDelete] = useState<LetterItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [letterToReject, setLetterToReject] = useState<LetterItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const load = (nextPage = page) => {
    listLettersAction({
      page: nextPage,
      pageSize: 10,
      letterType: typeFilter,
      status: statusFilter,
      search: search.trim() || undefined,
    })
      .then((lettersResult) => setResult(lettersResult))
      .catch((error) => {
        showError(error instanceof Error ? error.message : "Gagal memuat surat.");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter]);

  const handleSearch = () => {
    load(1);
    setPage(1);
  };

  const handleCreate = async () => {
    if (!subject.trim()) {
      showError("Perihal surat wajib diisi.");
      return;
    }
    if (!date) {
      showError("Tanggal surat wajib diisi.");
      return;
    }
    setIsSubmitting(true);
    const letterResult = await createLetterAction({
      letterType,
      date,
      subject: subject.trim(),
      sender: sender.trim() || null,
      recipient: recipient.trim() || null,
      fileUrl: fileUrl.trim() || null,
    });
    setIsSubmitting(false);
    if ("error" in letterResult) {
      showError(letterResult.error);
      return;
    }
    showSuccess("Surat berhasil dibuat.");
    setIsModalOpen(false);
    setLetterType("MASUK");
    setDate("");
    setSubject("");
    setSender("");
    setRecipient("");
    setFileUrl("");
    load(1);
    setPage(1);
  };

  const handleConfirmDelete = async () => {
    if (!letterToDelete) return;
    setIsDeleting(true);
    const letterResult = await deleteLetterAction(letterToDelete.id);
    setIsDeleting(false);
    if ("error" in letterResult) {
      showError(letterResult.error);
      return;
    }
    showSuccess("Surat dihapus.");
    setLetterToDelete(null);
    load();
  };

  const handleApprove = async (letter: LetterItem) => {
    const letterResult = await approveLetterAction(letter.id);
    if ("error" in letterResult) {
      showError(letterResult.error);
      return;
    }
    showSuccess(`Surat disetujui${letterResult.letterNumber ? ` (${letterResult.letterNumber})` : ""}.`);
    load();
  };

  const handleConfirmReject = async () => {
    if (!letterToReject) return;
    if (!rejectReason.trim()) {
      showError("Alasan penolakan wajib diisi.");
      return;
    }
    setIsRejecting(true);
    const letterResult = await rejectLetterAction(letterToReject.id, rejectReason.trim());
    setIsRejecting(false);
    if ("error" in letterResult) {
      showError(letterResult.error);
      return;
    }
    showSuccess("Surat ditolak.");
    setLetterToReject(null);
    setRejectReason("");
    load();
  };

  const handleArchive = async (letter: LetterItem) => {
    const letterResult = await archiveLetterAction(letter.id);
    if ("error" in letterResult) {
      showError(letterResult.error);
      return;
    }
    showSuccess("Surat diarsipkan.");
    load();
  };

  if (isLoading && !result) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-primary">
        <Spinner size="large" />
      </div>
    );
  }

  const letters = result?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Surat"
        description="Kelola surat masuk dan surat keluar."
        action={
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusIcon className="h-4 w-4" />
            Buat Surat
          </Button>
        }
      />

      <Card className="mb-5 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            id="letter-search"
            placeholder="Cari perihal / nomor surat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          <Select id="letter-type-filter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="ALL">Semua Jenis</option>
            <option value="MASUK">Surat Masuk</option>
            <option value="KELUAR">Surat Keluar</option>
          </Select>
          <Select id="letter-status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">Semua Status</option>
            {Object.entries(statusLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Button variant="secondary" onClick={handleSearch}>
            Cari
          </Button>
        </div>
      </Card>

      {letters.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {letters.map((letter) => (
            <Card key={letter.id} className="flex flex-col p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-soft text-primary">
                  <DocumentIcon className="h-5 w-5" />
                </span>
                <div className="flex items-center gap-1">
                  <Badge variant="neutral">{typeLabel[letter.letterType] ?? letter.letterType}</Badge>
                  <Badge variant={statusVariant[letter.status] ?? "neutral"}>
                    {statusLabel[letter.status] ?? letter.status}
                  </Badge>
                </div>
              </div>

              <h2 className="text-base font-semibold text-foreground">{letter.subject}</h2>
              <p className="mt-1 text-xs text-muted">
                {letter.letterNumber ? `No. ${letter.letterNumber}` : "Nomor belum dibuat"}
              </p>
              <p className="mt-1 text-sm text-muted">
                {formatDate(letter.date)}
                {letter.sender ? ` · Pengirim: ${letter.sender}` : ""}
                {letter.recipient ? ` · Tujuan: ${letter.recipient}` : ""}
              </p>
              {letter.rejectionReason ? (
                <p className="mt-2 rounded-md bg-danger-soft px-3 py-2 text-xs text-danger">
                  Alasan tolak: {letter.rejectionReason}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                {letter.status === "DRAFT" || letter.status === "REVIEW" ? (
                  <Button size="small" onClick={() => handleApprove(letter)}>
                    Setujui
                  </Button>
                ) : null}
                {letter.status === "DRAFT" || letter.status === "REVIEW" ? (
                  <Button size="small" variant="secondary" onClick={() => setLetterToReject(letter)}>
                    Tolak
                  </Button>
                ) : null}
                {letter.status !== "ARCHIVED" ? (
                  <Button size="small" variant="secondary" onClick={() => handleArchive(letter)}>
                    Arsipkan
                  </Button>
                ) : null}
                {letter.fileUrl ? (
                  <a
                    href={letter.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    File
                  </a>
                ) : null}
                <span className="ml-auto">
                  <Button
                    variant="ghost"
                    size="small"
                    aria-label={`Hapus surat ${letter.subject}`}
                    className="text-danger hover:bg-danger-soft hover:text-danger"
                    onClick={() => setLetterToDelete(letter)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<DocumentIcon className="h-6 w-6" />}
            title="Belum ada surat"
            description="Buat surat pertama untuk mulai mengelola korespondensi."
            action={
              <Button onClick={() => setIsModalOpen(true)}>
                <PlusIcon className="h-4 w-4" />
                Buat Surat
              </Button>
            }
          />
        </Card>
      )}

      {result && result.totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted">Menampilkan {result.total} surat</p>
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
        title="Buat Surat"
        description="Catat surat masuk atau keluar baru."
        maxWidth="large"
      >
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Select id="letter-type" label="Jenis Surat" value={letterType} onChange={(e) => setLetterType(e.target.value as LetterType)}>
              <option value="MASUK">Surat Masuk</option>
              <option value="KELUAR">Surat Keluar</option>
            </Select>
            <Input id="letter-date" label="Tanggal Surat" type="date" value={date} onChange={(e) => setDate(e.target.value)} placeholder="dd/mm/yyyy" />
          </div>
          <Input
            id="letter-subject"
            label="Perihal"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="mis. Undangan rapat koordinasi"
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              id="letter-sender"
              label="Pengirim (opsional)"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="mis. Dinas Pendidikan"
            />
            <Input
              id="letter-recipient"
              label="Penerima (opsional)"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="mis. Ketua OSIS"
            />
          </div>
          <Input
            id="letter-file"
            label="URL File (opsional)"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="https://... / path file"
          />

          <div className="mt-2 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreate} isLoading={isSubmitting}>
              Buat Surat
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={letterToDelete !== null}
        title="Hapus Surat"
        message={letterToDelete ? `Anda yakin ingin menghapus surat "${letterToDelete.subject}"?` : ""}
        confirmLabel="Hapus Surat"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setLetterToDelete(null)}
      />

      <Modal
        open={letterToReject !== null}
        onClose={() => {
          setLetterToReject(null);
          setRejectReason("");
        }}
        title="Tolak Surat"
        description={letterToReject ? `Berikan alasan penolakan untuk "${letterToReject.subject}".` : ""}
      >
        <div className="flex flex-col gap-5">
          <Input
            id="reject-reason"
            label="Alasan Penolakan"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="mis. Dokumen belum lengkap"
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setLetterToReject(null);
                setRejectReason("");
              }}
            >
              Batal
            </Button>
            <Button variant="danger" onClick={handleConfirmReject} isLoading={isRejecting}>
              Tolak Surat
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

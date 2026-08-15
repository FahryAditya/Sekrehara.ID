"use client";

import { useState } from "react";
import { useDataStore } from "@/lib/data-store";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AnnouncementForm } from "@/components/feature/announcement-form";
import { MegaphoneIcon, InboxIcon } from "@/components/ui/icons";
import { formatDateTime } from "@/lib/format";

export default function PengumumanPage() {
  const { participants, announcements, addAnnouncement } = useDataStore();
  const { showSuccess, showError } = useToast();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingSubject, setPendingSubject] = useState("");
  const [pendingBody, setPendingBody] = useState("");

  const recipientCount = participants.filter((participant) => participant.email).length;

  const sortedAnnouncements = [...announcements].sort((a, b) =>
    b.sentAt.localeCompare(a.sentAt)
  );

  const handleFormSubmit = (values: { subject: string; body: string }) => {
    if (recipientCount === 0) {
      showError("Tidak ada email peserta yang dapat menerima pengumuman.");
      return;
    }
    setPendingSubject(values.subject);
    setPendingBody(values.body);
    setIsConfirmOpen(true);
  };

  const handleConfirmSend = () => {
    addAnnouncement({
      subject: pendingSubject,
      body: pendingBody,
      recipientCount,
    });
    showSuccess(
      `Pengumuman berhasil dikirim ke ${recipientCount} email peserta.`
    );
    setIsConfirmOpen(false);
    setPendingSubject("");
    setPendingBody("");
  };

  return (
    <div>
      <PageHeader
        title="Broadcast Pengumuman"
        description="Kirim satu pengumuman ke seluruh email peserta sekaligus."
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Form pengumuman */}
        <section aria-label="Form pengumuman" className="lg:col-span-2">
          <Card className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-soft text-primary">
                <MegaphoneIcon className="h-5 w-5" />
              </span>
              <div className="flex flex-col">
                <h2 className="text-base font-semibold text-foreground">Tulis Pengumuman Baru</h2>
                <p className="text-sm text-muted">Isi akan dikirim ke inbox Gmail peserta.</p>
              </div>
            </div>
            <AnnouncementForm
              recipientCount={recipientCount}
              onSubmit={handleFormSubmit}
            />
          </Card>
        </section>

        {/* Riwayat pengumuman */}
        <section aria-label="Riwayat pengumuman" className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Riwayat Pengiriman</h2>
            <span className="text-sm text-muted">{announcements.length} pengumuman</span>
          </div>

          {sortedAnnouncements.length > 0 ? (
            <div className="flex flex-col gap-4">
              {sortedAnnouncements.map((announcement) => (
                <Card key={announcement.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                        <InboxIcon className="h-4 w-4" />
                      </span>
                      <div className="flex min-w-0 flex-col gap-1">
                        <h3 className="text-sm font-semibold text-foreground">
                          {announcement.subject}
                        </h3>
                        <p className="line-clamp-3 whitespace-pre-line text-sm leading-6 text-muted">
                          {announcement.body}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <Badge variant="success">Terkirim</Badge>
                      <span className="text-xs text-muted">
                        {announcement.recipientCount} penerima
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-border pt-3 text-xs text-muted">
                    Dikirim pada {formatDateTime(announcement.sentAt)}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background text-muted">
                <MegaphoneIcon className="h-6 w-6" />
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">Belum ada pengumuman</p>
                <p className="max-w-sm text-sm text-muted">
                  Kirim pengumuman pertama Anda melalui formulir di sebelah kiri.
                </p>
              </div>
            </Card>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        title="Kirim Pengumuman Massal"
        message={`Anda yakin ingin mengirim pengumuman "${pendingSubject}" ke ${recipientCount} email peserta? Pengiriman akan diproses melalui email organisasi.`}
        confirmLabel="Kirim Sekarang"
        onConfirm={handleConfirmSend}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
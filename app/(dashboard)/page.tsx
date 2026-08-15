"use client";

import Link from "next/link";
import { useDataStore } from "@/lib/data-store";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table } from "@/components/ui/table";
import {
  UsersIcon,
  ClipboardCheckIcon,
  WalletIcon,
  MegaphoneIcon,
  PlusIcon,
  InboxIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from "@/components/ui/icons";
import { formatRupiah, formatDate, formatDateTime, formatPercent } from "@/lib/format";
import type { AttendanceStatus, Transaction } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";

const statusLabel: Record<AttendanceStatus, string> = {
  HADIR: "Hadir",
  IZIN: "Izin",
  ALPA: "Alpa",
};

const statusBadgeVariant: Record<AttendanceStatus, "success" | "warning" | "danger"> = {
  HADIR: "success",
  IZIN: "warning",
  ALPA: "danger",
};

export default function DashboardPage() {
  const { participants, events, attendance, transactions, announcements } = useDataStore();
  const { currentUser } = useAuth();

  const today = new Date().toISOString().slice(0, 10);
  const todaysEvents = events.filter((event) => event.date.slice(0, 10) === today);
  const latestEvent = events[0];

  let hadirCount = 0;
  let izinCount = 0;
  let alpaCount = 0;
  let totalRecorded = 0;

  if (todaysEvents.length > 0) {
    const records = attendance[todaysEvents[0].id] ?? {};
    for (const status of Object.values(records)) {
      totalRecorded += 1;
      if (status === "HADIR") hadirCount += 1;
      if (status === "IZIN") izinCount += 1;
      if (status === "ALPA") alpaCount += 1;
    }
  }

  const totalPemasukan = transactions
    .filter((transaction) => transaction.type === "PEMASUKAN")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalPengeluaran = transactions
    .filter((transaction) => transaction.type === "PENGELUARAN")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const saldoAkhir = totalPemasukan - totalPengeluaran;

  const latestTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  const latestParticipants = [...participants]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const totalParticipantEmails = participants.filter((participant) => participant.email).length;

  const firstName = currentUser?.name?.split(" ")[0] ?? "Admin";
  const greetingMessage = `Selamat datang kembali, ${firstName}`;

  return (
    <div>
      <PageHeader
        title={greetingMessage}
        description="Berikut ringkasan kondisi organisasi Anda hari ini."
        action={
          <Link href="/peserta">
            <Button>
              <PlusIcon className="h-4 w-4" />
              Tambah Peserta
            </Button>
          </Link>
        }
      />

      <section aria-label="Statistik ringkasan" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Peserta"
          value={participants.length.toString()}
          icon={<UsersIcon className="h-5 w-5" />}
          accentClassName="bg-primary-soft text-primary"
        />
        <StatCard
          label="Kehadiran Hari Ini"
          value={totalRecorded > 0 ? formatPercent(hadirCount, totalRecorded) : "—"}
          icon={<ClipboardCheckIcon className="h-5 w-5" />}
          accentClassName="bg-success-soft text-success"
          footer={
            totalRecorded > 0
              ? `${hadirCount} hadir · ${izinCount} izin · ${alpaCount} alpa`
              : "Belum ada kegiatan hari ini"
          }
        />
        <StatCard
          label="Saldo Kas"
          value={formatRupiah(saldoAkhir)}
          icon={<WalletIcon className="h-5 w-5" />}
          accentClassName="bg-warning-soft text-warning"
          footer={
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-success">
                <TrendingUpIcon className="h-3.5 w-3.5" />
                {formatRupiah(totalPemasukan)}
              </span>
              <span className="flex items-center gap-1 text-danger">
                <TrendingDownIcon className="h-3.5 w-3.5" />
                {formatRupiah(totalPengeluaran)}
              </span>
            </span>
          }
        />
        <StatCard
          label="Pengumuman Terkirim"
          value={announcements.length.toString()}
          icon={<MegaphoneIcon className="h-5 w-5" />}
          accentClassName="bg-primary-soft text-primary"
          footer={`${totalParticipantEmails} email peserta siap dikirim`}
        />
      </section>

      {latestEvent ? (
        <section aria-label="Ringkasan presensi" className="mt-8">
          <Card>
            <CardHeader
              title={latestEvent.name}
              subtitle={`${formatDate(latestEvent.date)} · ${participants.length} peserta terdaftar`}
            />
            <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted">Kehadiran:</span>
                <div className="flex items-center gap-2">
                  {(["HADIR", "IZIN", "ALPA"] as AttendanceStatus[]).map((status) => {
                    const records = attendance[latestEvent.id] ?? {};
                    const count = Object.values(records).filter((s) => s === status).length;
                    return (
                      <Badge key={status} variant={statusBadgeVariant[status]}>
                        {statusLabel[status]}: {count}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <Link href={`/presensi/${latestEvent.id}`} className="ml-auto">
                <Button variant="secondary">Buka Lembar Presensi</Button>
              </Link>
            </div>
          </Card>
        </section>
      ) : null}

      <section aria-label="Transaksi dan peserta terbaru" className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Transaksi Terbaru"
            subtitle="5 transaksi terakhir"
            action={
              <Link href="/kas">
                <Button variant="ghost" size="small">
                  Lihat Semua
                </Button>
              </Link>
            }
          />
          {latestTransactions.length > 0 ? (
            <Table
              columns={[
                {
                  header: "Tanggal",
                  accessor: (transaction: Transaction) => formatDate(transaction.date),
                },
                {
                  header: "Keterangan",
                  accessor: (transaction: Transaction) => transaction.description,
                },
                {
                  header: "Jumlah",
                  accessor: (transaction: Transaction) => (
                    <span
                      className={
                        transaction.type === "PEMASUKAN" ? "text-success" : "text-danger"
                      }
                    >
                      {transaction.type === "PEMASUKAN" ? "+" : "−"}
                      {formatRupiah(transaction.amount)}
                    </span>
                  ),
                },
              ]}
              data={latestTransactions}
              rowKey={(transaction) => transaction.id}
            />
          ) : (
            <EmptyState
              icon={<WalletIcon className="h-6 w-6" />}
              title="Belum ada transaksi"
              description="Catat transaksi pertama di menu Buku Kas."
            />
          )}
        </Card>

        <Card>
          <CardHeader
            title="Peserta Terbaru"
            subtitle="5 peserta yang baru terdaftar"
            action={
              <Link href="/peserta">
                <Button variant="ghost" size="small">
                  Lihat Semua
                </Button>
              </Link>
            }
          />
          {latestParticipants.length > 0 ? (
            <Table
              columns={[
                {
                  header: "Nama",
                  accessor: (participant: (typeof participants)[number]) => participant.name,
                },
                {
                  header: "Email",
                  accessor: (participant: (typeof participants)[number]) => participant.email,
                },
                {
                  header: "Terdaftar",
                  accessor: (participant: (typeof participants)[number]) =>
                    formatDateTime(participant.createdAt),
                },
              ]}
              data={latestParticipants}
              rowKey={(participant) => participant.id}
            />
          ) : (
            <EmptyState
              icon={<UsersIcon className="h-6 w-6" />}
              title="Belum ada peserta"
              description="Tambahkan peserta pertama Anda."
            />
          )}
        </Card>
      </section>

      <section aria-label="Pengumuman terakhir" className="mt-8">
        <Card>
          <CardHeader
            title="Pengumuman Terakhir"
            subtitle="Kiriman broadcast terbaru ke peserta"
            action={
              <Link href="/pengumuman">
                <Button variant="ghost" size="small">
                  Buka Pengumuman
                </Button>
              </Link>
            }
          />
          {announcements.length > 0 ? (
            <ul className="divide-y divide-border">
              {announcements.slice(0, 3).map((announcement) => (
                <li key={announcement.id} className="flex items-start gap-3 px-6 py-4">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                    <InboxIcon className="h-4 w-4" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p className="text-sm font-medium text-foreground">{announcement.subject}</p>
                    <p className="line-clamp-2 text-sm text-muted">{announcement.body}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant="success">Terkirim</Badge>
                    <span className="text-xs text-muted">
                      {formatDateTime(announcement.sentAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<MegaphoneIcon className="h-6 w-6" />}
              title="Belum ada pengumuman"
              description="Kirim pengumuman pertama melalui menu Pengumuman."
            />
          )}
        </Card>
      </section>
    </div>
  );
}
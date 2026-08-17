import Link from "next/link";
import { getDashboardStatsAction } from "@/lib/dashboard-actions";
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

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStatsAction();
  const {
    currentUser,
    memberCount,
    totalParticipantEmails,
    todayEvent,
    latestEvent,
    cashSummary,
    latestTransactions,
    latestParticipants,
    announcementsTotal,
    latestAnnouncements,
  } = stats;

  const firstName = currentUser.name?.split(" ")[0] ?? "Admin";
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
          value={memberCount.toString()}
          numericValue={memberCount}
          animateValue
          icon={<UsersIcon className="h-5 w-5" />}
          accentClassName="bg-primary-soft text-primary"
        />
        <StatCard
          label="Kehadiran Hari Ini"
          value={todayEvent && todayEvent.recorded > 0 ? formatPercent(todayEvent.hadir, todayEvent.recorded) : "—"}
          icon={<ClipboardCheckIcon className="h-5 w-5" />}
          accentClassName="bg-success-soft text-success"
          footer={
            todayEvent && todayEvent.recorded > 0
              ? `${todayEvent.hadir} hadir · ${todayEvent.izin} izin · ${todayEvent.alpa} alpa`
              : "Belum ada kegiatan hari ini"
          }
        />
        <StatCard
          label="Saldo Kas"
          value={formatRupiah(cashSummary.saldo)}
          numericValue={cashSummary.saldo}
          animateValue
          formatValue={(num) => formatRupiah(num)}
          icon={<WalletIcon className="h-5 w-5" />}
          accentClassName="bg-warning-soft text-warning"
          footer={
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-success">
                <TrendingUpIcon className="h-3.5 w-3.5" />
                {formatRupiah(cashSummary.pemasukan)}
              </span>
              <span className="flex items-center gap-1 text-danger">
                <TrendingDownIcon className="h-3.5 w-3.5" />
                {formatRupiah(cashSummary.pengeluaran)}
              </span>
            </span>
          }
        />
        <StatCard
          label="Pengumuman Terkirim"
          value={announcementsTotal.toString()}
          numericValue={announcementsTotal}
          animateValue
          icon={<MegaphoneIcon className="h-5 w-5" />}
          accentClassName="bg-primary-soft text-primary"
          footer={`${totalParticipantEmails} email peserta siap dikirim`}
        />
      </section>

      {latestEvent ? (
        <section aria-label="Ringkasan presensi" className="mt-8 animate-fade-in-up" style={{ animationDelay: "40ms" }}>
          <Card>
            <CardHeader
              title={latestEvent.name}
              subtitle={`${formatDate(latestEvent.date)} · ${memberCount} peserta terdaftar`}
            />
            <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted">Kehadiran:</span>
                <div className="flex items-center gap-2">
                  {(
                    [
                      { key: "HADIR", count: latestEvent.hadir, variant: "success" as const },
                      { key: "IZIN", count: latestEvent.izin, variant: "warning" as const },
                      { key: "ALPA", count: latestEvent.alpa, variant: "danger" as const },
                    ]
                  ).map(({ key, count, variant }) => (
                    <Badge key={key} variant={variant}>
                      {key}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
              <Link href={`/presensi/${latestEvent.id}`} className="ml-auto">
                <Button variant="secondary">Buka Lembar Presensi</Button>
              </Link>
            </div>
          </Card>
        </section>
      ) : null}

      <section
        aria-label="Transaksi dan peserta terbaru"
        className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2 animate-fade-in-up"
        style={{ animationDelay: "80ms" }}
      >
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
                  accessor: (transaction) => formatDate(transaction.date),
                },
                {
                  header: "Keterangan",
                  accessor: (transaction) => transaction.description,
                },
                {
                  header: "Jumlah",
                  accessor: (transaction) => (
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
                  accessor: (participant) => participant.name,
                },
                {
                  header: "Email",
                  accessor: (participant) => participant.email,
                },
                {
                  header: "Terdaftar",
                  accessor: (participant) => formatDateTime(participant.createdAt),
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

      <section
        aria-label="Pengumuman terakhir"
        className="mt-8 animate-fade-in-up"
        style={{ animationDelay: "120ms" }}
      >
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
          {latestAnnouncements.length > 0 ? (
            <ul className="divide-y divide-border">
              {latestAnnouncements.map((announcement) => (
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

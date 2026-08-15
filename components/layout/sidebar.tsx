import Link from "next/link";
import { usePathname } from "next/navigation";
import { combineClassNames } from "@/lib/utils";
import {
  DashboardIcon,
  UsersIcon,
  ClipboardCheckIcon,
  WalletIcon,
  MegaphoneIcon,
  ShieldIcon,
  CalendarIcon,
  TaskIcon,
  DocumentIcon,
  FolderIcon,
  ChartIcon,
  UserIcon,
  BuildingIcon,
  KeyIcon,
} from "@/components/ui/icons";

type SidebarItem = {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  superAdminOnly?: boolean;
};

const sidebarItems: SidebarItem[] = [
  {
    href: "/",
    label: "Dashboard",
    description: "Ringkasan kegiatan",
    icon: DashboardIcon,
  },
  {
    href: "/profil",
    label: "Profil",
    description: "Akun dan kata sandi",
    icon: UserIcon,
  },
  {
    href: "/agenda",
    label: "Agenda",
    description: "Kelola kegiatan",
    icon: CalendarIcon,
  },
  {
    href: "/rapat",
    label: "Rapat",
    description: "Jadwal & notulen",
    icon: BuildingIcon,
  },
  {
    href: "/tugas",
    label: "Tugas",
    description: "Pekerjaan organisasi",
    icon: TaskIcon,
  },
  {
    href: "/peserta",
    label: "Peserta",
    description: "Kelola data peserta",
    icon: UsersIcon,
  },
  {
    href: "/presensi",
    label: "Presensi",
    description: "Catat kehadiran",
    icon: ClipboardCheckIcon,
  },
  {
    href: "/kas",
    label: "Buku Kas",
    description: "Arus kas organisasi",
    icon: WalletIcon,
  },
  {
    href: "/pengumuman",
    label: "Pengumuman",
    description: "Kirim info massal",
    icon: MegaphoneIcon,
  },
  {
    href: "/surat",
    label: "Surat",
    description: "Korespondensi surat",
    icon: DocumentIcon,
  },
  {
    href: "/arsip",
    label: "Arsip",
    description: "Penyimpanan dokumen",
    icon: FolderIcon,
  },
  {
    href: "/proker",
    label: "Program Kerja",
    description: "Pantau progres",
    icon: ChartIcon,
  },
  {
    href: "/roles",
    label: "Perizinan",
    description: "Kelola hak akses",
    icon: KeyIcon,
    superAdminOnly: true,
  },
  {
    href: "/pengguna",
    label: "Pengguna",
    description: "Kelola akun admin",
    icon: ShieldIcon,
    superAdminOnly: true,
  },
];

type SidebarLinkProps = {
  item: SidebarItem;
  isActive: boolean;
  onNavigate?: () => void;
};

function SidebarLink({ item, isActive, onNavigate }: SidebarLinkProps) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={combineClassNames(
        "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "active:scale-[0.98]",
        isActive
          ? "bg-primary-soft text-primary"
          : "text-zinc-600 hover:bg-background hover:text-foreground"
      )}
    >
      <item.icon
        className={combineClassNames(
          "h-5 w-5 shrink-0 transition-transform duration-200",
          isActive ? "scale-110" : "group-hover:scale-105"
        )}
      />
      <span className="flex flex-col">
        <span>{item.label}</span>
        <span
          className={combineClassNames(
            "text-xs font-normal",
            isActive ? "text-primary/70" : "text-muted"
          )}
        >
          {item.description}
        </span>
      </span>
      {isActive ? (
        <span className="ml-auto h-5 w-1 rounded-full bg-primary animate-fade-in" aria-hidden="true" />
      ) : null}
    </Link>
  );
}

export function Sidebar({
  currentRole,
  onNavigate,
}: {
  currentRole: "ADMIN" | "SUPERADMIN";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const visibleItems = sidebarItems.filter(
    (item) => !item.superAdminOnly || currentRole === "SUPERADMIN"
  );

  return (
    <div className="flex h-full flex-col gap-1">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-sm font-semibold text-white">
          S
        </span>
        <span className="text-base font-semibold text-foreground">SekreHara</span>
      </div>

      <nav aria-label="Navigasi utama" className="flex flex-1 flex-col gap-1 overflow-y-auto pb-4">
        {visibleItems.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            isActive={pathname === item.href}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </div>
  );
}

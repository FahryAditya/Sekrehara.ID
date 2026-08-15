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
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        isActive
          ? "bg-primary-soft text-primary"
          : "text-zinc-600 hover:bg-background hover:text-foreground"
      )}
    >
      <item.icon className="h-5 w-5 shrink-0" />
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

      <nav aria-label="Navigasi utama" className="flex flex-col gap-1">
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

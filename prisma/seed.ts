import "dotenv/config";
import { PrismaClient, type Role } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "admin123";

type SeedUser = {
  name: string;
  email: string;
  password: string;
  role: Role;
};

const users: SeedUser[] = [
  {
    name: "Administrator Utama",
    email: "admin@sekrehara.id",
    password: ADMIN_PASSWORD,
    role: "SUPERADMIN",
  },
  {
    name: "Fahry Aditya Setiawan",
    email: "Fahryadityasetiawann@gmail.com",
    password: "AdministratorFahry",
    role: "SUPERADMIN",
  },
];

const permissions: { name: string; description: string }[] = [
  { name: "manage_users", description: "Tambah/edit/hapus pengguna" },
  { name: "manage_roles", description: "Kelola hak akses & peran" },
  { name: "view_finance", description: "Lihat keuangan" },
  { name: "manage_finance", description: "Buat/edit keuangan" },
  { name: "approve_document", description: "Menyetujui surat/proposal" },
  { name: "create_agenda", description: "Membuat agenda" },
  { name: "view_all_tasks", description: "Lihat semua tugas" },
  { name: "manage_members", description: "Kelola data anggota" },
  { name: "manage_sekbid", description: "Kelola sekbid" },
  { name: "manage_positions", description: "Kelola jabatan" },
  { name: "manage_agenda", description: "Kelola agenda" },
  { name: "manage_meetings", description: "Kelola rapat" },
  { name: "manage_tasks", description: "Kelola tugas" },
  { name: "manage_letters", description: "Kelola surat" },
  { name: "manage_archive", description: "Kelola arsip & berkas" },
  { name: "manage_work_programs", description: "Kelola program kerja" },
  { name: "view_reports", description: "Lihat laporan & statistik" },
];

const permissionMap: Record<Role, string[]> = {
  SUPERADMIN: permissions.map((p) => p.name),
  ADMIN: [
    "view_finance",
    "manage_finance",
    "approve_document",
    "create_agenda",
    "view_all_tasks",
    "manage_members",
    "manage_sekbid",
    "manage_positions",
    "manage_agenda",
    "manage_meetings",
    "manage_tasks",
    "manage_letters",
    "manage_archive",
    "manage_work_programs",
    "view_reports",
  ],
};

const sekbids: { name: string; description: string }[] = [
  { name: "Sekbid 1", description: "Pembinaan keimanan dan ketakwaan terhadap Tuhan Yang Maha Esa" },
  { name: "Sekbid 2", description: "Pembinaan budi pekerti luhur atau akhlak mulia" },
  { name: "Sekbid 3", description: "Pembinaan kepribadian, kepemimpinan, dan kemandirian" },
  { name: "Sekbid 4", description: "Pembinaan prestasi akademik, seni, dan olahraga" },
  { name: "Sekbid 5", description: "Pembinaan demokrasi, hak asasi manusia, pendidikan politik" },
  { name: "Sekbid 6", description: "Pembinaan kreativitas, keterampilan, dan kewirausahaan" },
  { name: "Sekbid 7", description: "Pembinaan kesegaran jasmani, daya kreasi, dan rekreasi" },
  { name: "Sekbid 8", description: "Pembinaan persepsi, apresiasi, dan kreasi seni" },
  { name: "Sekbid 9", description: "Pembinaan teknologi informasi dan komunikasi" },
  { name: "Sekbid 10", description: "Pembinaan komunikasi dalam bahasa Inggris dan bahasa lainnya" },
];

const positions: { name: string; description: string; level: number }[] = [
  { name: "Ketua OSIS", description: "Pemimpin tertinggi organisasi", level: 1 },
  { name: "Wakil Ketua OSIS", description: "Mendampingi ketua dalam menjalankan tugas", level: 2 },
  { name: "Sekretaris Umum", description: "Mengelola administrasi dan kesekretariatan", level: 3 },
  { name: "Bendahara Umum", description: "Mengelola keuangan organisasi", level: 3 },
  { name: "Koordinator Sekbid", description: "Memimpin masing-masing sekbid", level: 4 },
  { name: "Anggota", description: "Anggota aktif OSIS", level: 5 },
];

const seedMembers: { name: string; kelas: string; jurusan: string; nomorInduk: string }[] = [
  { name: "Andi Saputra", kelas: "XI-1", jurusan: "IPA", nomorInduk: "2023-001" },
  { name: "Bella Kusuma", kelas: "XI-2", jurusan: "IPA", nomorInduk: "2023-002" },
  { name: "Citra Anggraini", kelas: "XI-3", jurusan: "IPS", nomorInduk: "2023-003" },
  { name: "Dimas Pratama", kelas: "X-1", jurusan: "IPA", nomorInduk: "2024-001" },
  { name: "Eka Ramadhani", kelas: "X-2", jurusan: "IPS", nomorInduk: "2024-002" },
  { name: "Farhan Maulana", kelas: "XII-1", jurusan: "IPA", nomorInduk: "2022-001" },
  { name: "Gita Puspita", kelas: "XII-2", jurusan: "IPS", nomorInduk: "2022-002" },
  { name: "Hadi Wijaya", kelas: "XI-4", jurusan: "Bahasa", nomorInduk: "2023-004" },
];

async function seedPermissions() {
  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: { description: p.description },
      create: p,
    });
  }
}

async function seedRolePermissions() {
  for (const [role, names] of Object.entries(permissionMap)) {
    for (const name of names) {
      const permission = await prisma.permission.findUnique({ where: { name } });
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role: role as Role, permissionId: permission.id } },
        update: {},
        create: { role: role as Role, permissionId: permission.id },
      });
    }
  }
}

async function seedSekbids() {
  for (const s of sekbids) {
    await prisma.sekbid.upsert({
      where: { name: s.name },
      update: { description: s.description },
      create: s,
    });
  }
}

async function seedPositions() {
  for (const p of positions) {
    await prisma.position.upsert({
      where: { name: p.name },
      update: { description: p.description, level: p.level },
      create: p,
    });
  }
}

async function seedMembersData() {
  for (const m of seedMembers) {
    await prisma.member.upsert({
      where: { nomorInduk: m.nomorInduk },
      update: {},
      create: {
        name: m.name,
        kelas: m.kelas,
        jurusan: m.jurusan,
        nomorInduk: m.nomorInduk,
        status: "AKTIF",
        joinDate: new Date(),
      },
    });
  }
}

async function main() {
  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
      },
    });
  }

  await seedPermissions();
  await seedRolePermissions();
  await seedSekbids();
  await seedPositions();
  await seedMembersData();

  console.log("Seed selesai.");
}

main()
  .catch((error) => {
    console.error("Seed gagal:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

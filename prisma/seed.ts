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
];

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

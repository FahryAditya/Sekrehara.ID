import type { AppData, User } from "@/lib/types";
import { createSeedData } from "@/lib/mock-data";

const DATA_STORAGE_KEY = "sekrehara-data";
const SESSION_STORAGE_KEY = "sekrehara-session";

function migrateUsers(users: User[]): User[] {
  const seedUsers = createSeedData().users;
  return users.map((user) => {
    if (user.password) return user;
    const seedMatch = seedUsers.find(
      (seedUser) => seedUser.email.toLowerCase() === user.email.toLowerCase()
    );
    return { ...user, password: seedMatch?.password ?? "admin123" };
  });
}

export function loadPersistedData(): AppData {
  if (typeof window === "undefined") {
    return createSeedData();
  }

  try {
    const storedValue = window.localStorage.getItem(DATA_STORAGE_KEY);
    if (storedValue) {
      const parsed = JSON.parse(storedValue) as AppData;
      const migratedUsers = migrateUsers(parsed.users ?? []);
      if (migratedUsers.some((user, index) => !parsed.users?.[index]?.password)) {
        const migratedData: AppData = { ...parsed, users: migratedUsers };
        persistData(migratedData);
        return migratedData;
      }
      return parsed;
    }
  } catch (error) {
    console.error("Gagal membaca data tersimpan:", error);
  }

  return createSeedData();
}

export function persistData(data: AppData): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Gagal menyimpan data:", error);
  }
}

export function saveMockSession(user: User): void {
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
}

export function getMockSession(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return storedValue ? (JSON.parse(storedValue) as User) : null;
  } catch {
    return null;
  }
}

export function clearMockSession(): void {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

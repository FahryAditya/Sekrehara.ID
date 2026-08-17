// Client-side cache memory store for instant page transitions ("sat set")
const DEFAULT_TTL_MS = 60_000;

type CacheEntry = {
  data: unknown;
  expiresAt: number;
};

const memoryCache = new Map<string, CacheEntry>();

export function getCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
  if (typeof window === "undefined") return;
  memoryCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function clearCache(key?: string): void {
  if (typeof window === "undefined") return;
  if (key) {
    memoryCache.delete(key);
  } else {
    memoryCache.clear();
  }
}
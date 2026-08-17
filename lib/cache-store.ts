// Client-side cache memory store for instant page transitions ("sat set")
const memoryCache = new Map<string, unknown>();

export function getCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const data = memoryCache.get(key);
  return data !== undefined ? (data as T) : null;
}

export function setCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  memoryCache.set(key, data);
}

export function clearCache(key?: string): void {
  if (typeof window === "undefined") return;
  if (key) {
    memoryCache.delete(key);
  } else {
    memoryCache.clear();
  }
}

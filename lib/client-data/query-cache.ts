type CacheEntry<T> = {
  data: T;
  fetchedAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export function getCachedData<T>(
  key: string,
  maxAgeMs: number
): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > maxAgeMs) return null;
  return entry.data;
}

export function setCachedData<T>(key: string, data: T): void {
  store.set(key, { data, fetchedAt: Date.now() });
}

export function invalidateCachedData(key: string): void {
  store.delete(key);
  inflight.delete(key);
}

export function invalidateCachedPrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
  for (const key of inflight.keys()) {
    if (key.startsWith(prefix)) inflight.delete(key);
  }
}

/**
 * Shared in-flight + TTL cache for client fetches.
 * Concurrent callers with the same key share one network request.
 */
export async function fetchCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttlMs?: number; force?: boolean }
): Promise<T> {
  const ttlMs = options?.ttlMs ?? 60_000;
  if (!options?.force) {
    const cached = getCachedData<T>(key, ttlMs);
    if (cached !== null) return cached;
  }

  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fetcher()
    .then((data) => {
      setCachedData(key, data);
      return data;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

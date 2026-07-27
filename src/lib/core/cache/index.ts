export interface CacheStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  del(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
  keys(pattern?: string): Promise<string[]>;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
}

export function createMemoryCache(): CacheStore {
  const store = new Map<string, CacheEntry<unknown>>();

  function isExpired(entry: CacheEntry<unknown>): boolean {
    return entry.expiresAt !== null && Date.now() > entry.expiresAt;
  }

  return {
    async get<T>(key: string): Promise<T | undefined> {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (isExpired(entry)) {
        store.delete(key);
        return undefined;
      }
      return entry.value as T;
    },

    async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
      store.set(key, {
        value,
        expiresAt: ttlMs ? Date.now() + ttlMs : null,
      });
    },

    async del(key: string): Promise<void> {
      store.delete(key);
    },

    async has(key: string): Promise<boolean> {
      const entry = store.get(key);
      if (!entry) return false;
      if (isExpired(entry)) {
        store.delete(key);
        return false;
      }
      return true;
    },

    async clear(): Promise<void> {
      store.clear();
    },

    async keys(pattern?: string): Promise<string[]> {
      const allKeys = Array.from(store.keys());
      if (!pattern) return allKeys;
      const regex = new RegExp(pattern.replace(/\*/g, ".*"));
      return allKeys.filter((k) => regex.test(k));
    },
  };
}

export const memoryCache = createMemoryCache();
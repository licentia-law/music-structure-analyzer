/**
 * Smart Firebase Cache
 * In-memory cache to reduce redundant Firestore/Storage reads.
 *
 * peek() return semantics:
 *   undefined  — key not in cache
 *   null       — key cached as "does not exist"
 *   T          — key cached with data
 */

const DEFAULT_MAX_SIZE = 100;
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  value: T | null; // null = known non-existent
  exists: boolean;
  complete: boolean; // passes validation at write time
  timestamp: number;
}

export class SmartFirebaseCache<T extends Record<string, unknown>> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly ttlMs: number;

  constructor(maxSize = DEFAULT_MAX_SIZE, ttlMs = DEFAULT_TTL_MS) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  /**
   * Returns:
   *   undefined  — not cached
   *   null       — cached as non-existent
   *   T          — cached value
   */
  peek(key: string): T | null | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * Async get with fetch-on-miss.
   * fetchFn is called when key is not cached.
   * validateFn (optional) marks the entry as complete/incomplete.
   */
  async get(
    key: string,
    fetchFn: () => Promise<T | null>,
    validateFn?: (data: T) => boolean
  ): Promise<T | null> {
    const cached = this.peek(key);
    if (cached !== undefined) return cached;

    const value = await fetchFn();
    const complete = value !== null && validateFn ? validateFn(value) : value !== null;
    this.set(key, value, value !== null, complete);
    return value;
  }

  set(key: string, value: T | null, exists: boolean, complete = true): void {
    if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }

    this.cache.set(key, { value, exists, complete, timestamp: Date.now() });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { totalEntries: number; incompleteEntries: number } {
    let incompleteEntries = 0;
    for (const entry of this.cache.values()) {
      if (!entry.complete) incompleteEntries++;
    }
    return { totalEntries: this.cache.size, incompleteEntries };
  }
}

// Shared instance for transcription documents
export const transcriptionCache = new SmartFirebaseCache<Record<string, unknown>>();

// Shared instance for audio metadata
export const audioMetadataCache = new SmartFirebaseCache<Record<string, unknown>>();

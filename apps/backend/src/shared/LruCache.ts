export type LruCacheOptions = { maxSize: number };

/**
 * Keeps at most `maxSize` values. Drops the least recently used value to make room for a new one.
 */
export class LruCache<Key, Value extends object> {
  private readonly values = new Map<Key, Value>();

  private readonly maxSize: number;

  constructor({ maxSize }: LruCacheOptions) {
    this.maxSize = maxSize;
  }

  /**
   * Returns the value for `key` and marks it as the most recently used one. Returns undefined when
   * the cache has no value for `key`.
   */
  public get(key: Key): Value | undefined {
    const value = this.values.get(key);

    if (value) {
      this.set(key, value);
    }

    return value;
  }

  public set(key: Key, value: Value) {
    this.values.delete(key);
    this.values.set(key, value);

    if (this.values.size > this.maxSize) {
      const [leastRecentlyUsedKey] = this.values.keys();

      this.values.delete(leastRecentlyUsedKey);
    }
  }
}

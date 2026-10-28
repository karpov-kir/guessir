/** Keeps at most `maxSize` values and drops the least recently used one to make room for a new one. */
export class LruCache<Key, Value extends object> {
  // A `Map` iterates in insertion order, so the first key is the least recently used one
  private readonly values = new Map<Key, Value>();

  constructor(private readonly maxSize: number) {}

  /** Returns the value for `key` and marks it as the most recently used one, or undefined when there is none. */
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

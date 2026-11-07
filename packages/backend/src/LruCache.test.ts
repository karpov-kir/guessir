import { describe, expect, it } from 'vitest';

import { LruCache } from './LruCache';

describe(LruCache, () => {
  it('should give back a stored value, and undefined for a key it never stored', () => {
    const lruCache = new LruCache<string, { value: number }>(2);

    lruCache.set('one', { value: 1 });

    expect(lruCache.get('one')).toEqual({ value: 1 });
    expect(lruCache.get('two')).toBeUndefined();
  });

  it('should drop the least recently used value beyond its bound', () => {
    const lruCache = new LruCache<string, { value: number }>(2);

    lruCache.set('one', { value: 1 });
    lruCache.set('two', { value: 2 });
    lruCache.get('one');
    lruCache.set('three', { value: 3 });

    expect(lruCache.get('one')).toEqual({ value: 1 });
    expect(lruCache.get('two')).toBeUndefined();
    expect(lruCache.get('three')).toEqual({ value: 3 });
  });

  it('should keep one value for a key stored twice', () => {
    const lruCache = new LruCache<string, { value: number }>(2);

    lruCache.set('one', { value: 1 });
    lruCache.set('one', { value: 10 });
    lruCache.set('two', { value: 2 });

    expect(lruCache.get('one')).toEqual({ value: 10 });
    expect(lruCache.get('two')).toEqual({ value: 2 });
  });
});

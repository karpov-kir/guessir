import { describe, expect, it, vi } from 'vitest';

import { Deferred } from './Deferred';

describe(Deferred, () => {
  it('should create a deferred with a default state', () => {
    const deferred = new Deferred();

    expect(deferred.state).toBe('pending');
  });

  it('should resolve a promise imperatively', async () => {
    const deferred = new Deferred<string>();
    const secondPromise = deferred.then(() => 'Test 2');

    setTimeout(() => {
      deferred.resolve('Test');
    }, 5);

    await expect(deferred.promise).resolves.toEqual('Test');
    await expect(secondPromise).resolves.toEqual('Test 2');
    expect(deferred.state).toBe('fulfilled');
  });

  it('should reject a promise imperatively', async () => {
    const deferred = new Deferred<string>();
    const secondPromise = deferred.catch(() => {
      throw new Error('Test 2');
    });

    setTimeout(() => {
      deferred.reject(new Error('Test'));
    }, 5);

    await expect(deferred.promise).rejects.toEqual(new Error('Test'));
    await expect(secondPromise).rejects.toEqual(new Error('Test 2'));
    expect(deferred.state).toBe('rejected');
  });

  it('should call a finally callback on fulfilled', async () => {
    const deferred = new Deferred<string>();
    const finallyCallback = vi.fn();
    const finallyPromise = deferred.finally(finallyCallback);

    setTimeout(() => {
      deferred.resolve('Test');
    }, 5);

    await expect(finallyPromise).resolves.toEqual('Test');
    expect(finallyCallback).toBeCalledWith();
  });

  it('should call a finally callback on rejection', async () => {
    const deferred = new Deferred<string>();
    const finallyCallback = vi.fn();
    const finallyPromise = deferred.finally(finallyCallback);

    setTimeout(() => {
      deferred.reject(new Error('Test'));
    }, 5);

    await expect(finallyPromise).rejects.toEqual(new Error('Test'));
    expect(finallyCallback).toBeCalledWith();
  });
});

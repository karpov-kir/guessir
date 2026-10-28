import { describe, expect, it } from 'vitest';

import { watchDb } from './dbWatch';

const down = new Error('getaddrinfo ENOTFOUND guessir_database');

/** Answers each ping with what `answer` returns for that ping's number, counted from 1 */
const fakeDb = (answer: (ping: number) => Promise<unknown>) => {
  const db = {
    pings: 0,
    ping: () => {
      db.pings += 1;
      return answer(db.pings);
    },
  };

  return db;
};

describe(watchDb, () => {
  it('should resolve with the last error once the database has failed every ping for the limit', async () => {
    // Pings 2-4 fail (a short restart), 5-9 answer, and from 10 on the database is gone
    const db = fakeDb((ping) => ((ping >= 2 && ping <= 4) || ping >= 10 ? Promise.reject(down) : Promise.resolve()));

    const error = await watchDb(db.ping, { limitMs: 200, intervalMs: 5 });

    expect(error).toBe(down);
    // Past the short outage, and more than one failed ping after the database is gone
    expect(db.pings).toBeGreaterThan(10);
  });

  it('should end the watch on a ping that never settles, with one ping in flight at a time', async () => {
    const db = fakeDb(() => new Promise(() => {}));

    const error = await watchDb(db.ping, { limitMs: 30, intervalMs: 5 });

    expect(error).toEqual(new Error('Database ping has not returned for 30ms'));
    expect(db.pings).toBe(1);
  });
});

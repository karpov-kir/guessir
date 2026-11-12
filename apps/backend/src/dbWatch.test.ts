import { Logger } from "@nestjs/common";
import { afterEach, describe, expect, it, vi } from "vitest";

import { errorText, waitForDb, watchDb } from "./dbWatch.js";

// Silences Nest's logger: these tests make the database fail on purpose.
Logger.overrideLogger(false);

const down = new Error("getaddrinfo ENOTFOUND guessir_database");

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
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should resolve with the last error once the database has failed every ping for the limit", async () => {
    // The test moves `Date.now` by one interval on each ping. Thus a slow machine cannot end the
    // watch early.
    let now = 0;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    // Pings 2-4 fail as a short restart, and pings 5-9 answer. From ping 10 on, the database is
    // gone.
    const db = fakeDb((ping) => {
      now += 5;
      return (ping >= 2 && ping <= 4) || ping >= 10 ? Promise.reject(down) : Promise.resolve();
    });

    const error = await watchDb(db.ping, { limitMs: 20, intervalMs: 5 });

    expect(error).toBe(down);
    // The short outage does not end the watch. The limit counts from ping 9, the last ping that
    // answered.
    expect(db.pings).toBe(13);
  });

  it("should end the watch on a ping that never settles, with one ping in flight at a time", async () => {
    const db = fakeDb(() => new Promise(() => {}));

    const error = await watchDb(db.ping, { limitMs: 30, intervalMs: 5 });

    expect(error).toEqual(new Error("Database ping has not returned for 30ms"));
    expect(db.pings).toBe(1);
  });

  it("should ping before ending the watch, even when one wait outlasts the limit", async () => {
    const db = fakeDb(() => new Promise(() => {}));

    await watchDb(db.ping, { limitMs: 5, intervalMs: 30 });

    expect(db.pings).toBe(1);
  });
});

describe(waitForDb, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return once the database answers", async () => {
    const db = fakeDb((ping) => (ping <= 3 ? Promise.reject(down) : Promise.resolve()));

    await waitForDb(db.ping, { limitMs: 1_000, intervalMs: 5 });

    expect(db.pings).toBe(4);
  });

  it("should throw the last ping error once the limit has passed", async () => {
    // The test moves `Date.now` by one interval on each ping. Thus a slow machine cannot change how
    // many pings fit in the limit.
    let now = 0;
    vi.spyOn(Date, "now").mockImplementation(() => now);
    const errors: Error[] = [];
    const db = fakeDb((ping) => {
      now += 5;
      errors.push(new Error(`ping ${ping} failed`));
      return Promise.reject(errors[ping - 1]);
    });

    const thrown = await waitForDb(db.ping, { limitMs: 50, intervalMs: 5 }).catch(
      (error: unknown) => error,
    );

    expect(db.pings).toBe(10);
    expect(thrown).toBe(errors[9]);
  });

  it("should throw by the limit on a ping that never settles", async () => {
    const db = fakeDb(() => new Promise(() => {}));

    await expect(waitForDb(db.ping, { limitMs: 30, intervalMs: 5 })).rejects.toEqual(
      new Error("Database ping has not returned for 30ms"),
    );
    expect(db.pings).toBe(1);
  });
});

describe(errorText, () => {
  it("should read an Error as its name and message, and inspect any other thrown value", () => {
    expect(errorText(new Error("ping failed"))).toBe("Error: ping failed");
    expect(errorText({ code: "ECONNREFUSED" })).toBe("{ code: 'ECONNREFUSED' }");
  });
});

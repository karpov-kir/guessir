import { describe, expect, it } from "vitest";

import { systemClock } from "./systemClock.js";

describe("systemClock", () => {
  it("should tell the system time", () => {
    const before = Date.now();

    expect(systemClock.now()).toBeGreaterThanOrEqual(before);
  });

  it("should wait at least the time asked for, holding the process or not", async () => {
    const start = Date.now();

    await systemClock.sleep(20);
    await systemClock.sleep(20, { holdsProcess: false });

    // The bound allows 1ms short per wait. Node can fire a timer up to a millisecond early by
    // `Date.now()`, which would fail a check against the full 40ms.
    expect(Date.now() - start).toBeGreaterThanOrEqual(38);
  });
});

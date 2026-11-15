import { describe, expect, it } from "vitest";

import { systemClock } from "./systemClock";

describe("systemClock", () => {
  it("should tell the system time", () => {
    const before = Date.now();
    const now = systemClock.now();

    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(Date.now());
  });
});

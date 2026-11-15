import { afterEach, describe, expect, it, vi } from "vitest";

import { systemClock } from "./systemClock";

describe("systemClock", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("should tell the system time", () => {
    const before = Date.now();
    const now = systemClock.now();

    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(Date.now());
  });

  it("should run a callback once its time passes, and not one that was cancelled", () => {
    vi.useFakeTimers();
    const ran = vi.fn<() => void>();
    const cleared = vi.fn<() => void>();

    systemClock.schedule(ran, 1_000);
    systemClock.schedule(cleared, 1_000)();
    vi.advanceTimersByTime(999);
    expect(ran).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);

    expect(ran).toHaveBeenCalledOnce();
    expect(cleared).not.toHaveBeenCalled();
  });
});

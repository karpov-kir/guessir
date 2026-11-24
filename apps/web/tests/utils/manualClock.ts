import type { Clock } from "#/shared/Clock.js";

/** Returns a clock whose time moves only when a test calls `advance`, which runs the timers due. */
export function newManualClock(start = 0): { clock: Clock; advance(ms: number): void } {
  let now = start;
  const timers = new Set<{ at: number; callback: () => void }>();

  return {
    clock: {
      now: () => now,
      schedule(callback, ms) {
        const timer = { at: now + ms, callback };

        timers.add(timer);
        return () => timers.delete(timer);
      },
    },
    advance(ms) {
      now += ms;
      for (const timer of [...timers].filter(({ at }) => at <= now)) {
        timers.delete(timer);
        timer.callback();
      }
    },
  };
}

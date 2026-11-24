import type { Clock } from "#src/shared/Clock.js";

/** Tells the system time and runs the browser's timers. */
export const systemClock: Clock = {
  now: () => Date.now(),
  schedule(callback, ms) {
    const id = globalThis.setTimeout(callback, ms);

    return () => globalThis.clearTimeout(id);
  },
};

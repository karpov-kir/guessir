import { setTimeout } from "node:timers/promises";

import type { Clock } from "../shared/Clock.js";

/** Tells the system time and waits on Node's timers. */
export const systemClock: Clock = {
  now: () => Date.now(),
  async sleep(ms, { holdsProcess = true } = {}) {
    await setTimeout(ms, undefined, { ref: holdsProcess });
  },
};

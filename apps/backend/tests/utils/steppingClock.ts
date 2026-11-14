import { systemClock } from "../../src/infra/systemClock.js";
import type { Clock } from "../../src/shared/Clock.js";

/** How many times faster than real time the stepping clock runs. */
const speedUp = 100;

/**
 * Returns a clock whose time moves only by the waits code asks for, and each wait lasts a
 * hundredth of its length in real time. A test then runs a minute of waits in under a second,
 * while a database still has real time to answer within each wait.
 */
export function steppingClock(): Clock {
  let now = 0;

  return {
    now: () => now,
    async sleep(ms, options) {
      now += ms;
      await systemClock.sleep(ms / speedUp, options);
    },
  };
}

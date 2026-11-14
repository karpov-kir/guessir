import { systemClock } from "../../src/infra/systemClock.js";
import type { Clock } from "../../src/shared/Clock.js";

/**
 * How many times faster than real time the stepping clock runs. At 20, the server's 30-second
 * watch limit lasts 1.5 real seconds, so a slow ping on a busy machine does not read as a lost
 * database.
 */
const speedUp = 20;

/**
 * Returns a clock whose time moves only by the waits code asks for, and each wait lasts a
 * twentieth of its length in real time. A test then runs a minute of waits in a few seconds, while
 * a database still has real time to answer within each wait.
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

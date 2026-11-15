import type { Clock } from "../shared/Clock";

/** Reads the wall clock of the host, in milliseconds since the Unix epoch. */
export const systemClock: Clock = {
  now: () => Date.now(),
};

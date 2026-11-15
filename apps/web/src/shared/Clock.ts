/** Tells the time and runs timers. Code that depends on time takes a Clock, so a test can drive it. */
export type Clock = {
  /** Returns the time in milliseconds since the Unix epoch. */
  now(): number;
  /** Runs `callback` once after `ms`, and returns the function that cancels it. */
  schedule(callback: () => void, ms: number): () => void;
};

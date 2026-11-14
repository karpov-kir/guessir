/** Tells the time and waits. Code that depends on time takes a Clock, so a test can drive it. */
export type Clock = {
  /** Returns the time in milliseconds since the Unix epoch. */
  now(): number;
  /**
   * Resolves after `ms`. A wait with `holdsProcess: false` does not keep the process running on its
   * own.
   */
  sleep(ms: number, options?: { holdsProcess?: boolean }): Promise<void>;
};

/** Tells the time. Code that depends on time takes a Clock, so a test can drive it. */
export type Clock = {
  /** Returns the time in milliseconds since the Unix epoch. */
  now(): number;
};

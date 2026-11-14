/** Makes random ids. Code that creates records takes one, so a test can fix the ids. */
export type IdGenerator = {
  /** Returns a new random id of `length` URL-safe characters. */
  newId(length: number): string;
};

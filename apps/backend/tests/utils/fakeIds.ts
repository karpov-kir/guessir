import type { IdGenerator } from "../../src/shared/IdGenerator.js";

/** Makes ids from a counter, padded to the length asked for, so a test can predict each one. */
export function fakeIds(): IdGenerator {
  let count = 0;

  return {
    newId(length) {
      count += 1;

      return `id${count}`.padEnd(length, "0");
    },
  };
}

import { Text, TextRows } from "#/features/texts/exports.js";

/** Means stored texts kept in memory, which a test can inspect and make fail. */
export type FakeTextRows = TextRows & {
  /** The texts stored now, by id. */
  readonly texts: ReadonlyMap<string, Text>;
  /** How many times the feature has read a text. */
  readonly readCount: number;
  /** Makes every later call of `operation` reject with `error`. */
  fail(operation: keyof TextRows, error: Error): void;
  /** Makes only the next call of `operation` reject with `error`. */
  failOnce(operation: keyof TextRows, error: Error): void;
};

/** Returns stored texts kept in memory, holding `texts` to start with. */
export function fakeTextRows(texts: Text[] = []): FakeTextRows {
  const rows = new Map(texts.map((text) => [text.id, text]));
  const failures = new Map<keyof TextRows, { error: Error; once: boolean }>();
  let readCount = 0;

  const throwIfFailing = (operation: keyof TextRows) => {
    const failure = failures.get(operation);

    if (failure) {
      if (failure.once) {
        failures.delete(operation);
      }

      throw failure.error;
    }
  };

  return {
    texts: rows,
    get readCount() {
      return readCount;
    },
    fail(operation, error) {
      failures.set(operation, { error, once: false });
    },
    failOnce(operation, error) {
      failures.set(operation, { error, once: true });
    },
    async getById(id) {
      readCount += 1;
      throwIfFailing("getById");

      return rows.get(id);
    },
    async insert(text) {
      throwIfFailing("insert");
      rows.set(text.id, text);
    },
  };
}

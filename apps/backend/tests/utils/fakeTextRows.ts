import { vi } from "vitest";

import { Text, TextRows } from "../../src/features/texts/exports.js";

/** Returns stored texts kept in memory, holding `texts` to start with. */
export function fakeTextRows(texts: Text[] = []) {
  const rows = new Map(texts.map((text) => [text.id, text]));

  return {
    getById: vi.fn(async (id: string) => rows.get(id)),
    insert: vi.fn(async (text: Text) => {
      rows.set(text.id, text);
    }),
  } satisfies TextRows;
}

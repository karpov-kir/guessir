import { DataSource } from "typeorm";

import { TextRow } from "./TextRow.js";

/** Means one row of the `texts` table, without the columns the database fills in itself. */
export type TextRecord = {
  id: string;
  title: string;
  description?: string;
  text: string;
  allowShowingFirstLetters: boolean;
  allowShowingText: boolean;
};

/** Reads and adds rows of the `texts` table, and keeps TypeORM out of its callers. */
export function newTextStore(dataSource: DataSource) {
  const repository = dataSource.getRepository(TextRow);

  return {
    /** Returns the text with `id`, or undefined when there is none. */
    async getById(id: string): Promise<TextRecord | undefined> {
      const row = await repository.findOne({ where: { id } });

      return row ? toRecord(row) : undefined;
    },

    async insert(record: TextRecord): Promise<void> {
      // TypeORM writes the generated columns back into the object it inserts, so it gets a copy
      await repository.insert({ ...record });
    },
  };
}

function toRecord({
  id,
  title,
  description,
  text,
  allowShowingFirstLetters,
  allowShowingText,
}: TextRow): TextRecord {
  return {
    id,
    title,
    description: description ?? undefined,
    text,
    allowShowingFirstLetters,
    allowShowingText,
  };
}

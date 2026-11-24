import type { Db } from "#src/infra/db/exports.js";
import type { Text, TextRows } from "#src/features/texts/port.js";

/** Means one row of the `texts` table, without the columns the database fills in itself. */
type TextRow = {
  id: string;
  title: string;
  description: string | null;
  text: string;
  allowShowingFirstLetters: boolean;
  allowShowingText: boolean;
};

type TextStoreOptions = {
  /** The database whose `texts` table the store reads and adds to. */
  db: Pick<Db, "query">;
};

/** Returns the texts feature's rows in the `texts` table. */
export function newTextStore({ db }: TextStoreOptions): TextRows {
  return {
    async getById(id) {
      const [row] = await db.query<TextRow[]>(
        `SELECT id, title, description, text, "allowShowingFirstLetters", "allowShowingText"
           FROM texts WHERE id = $1`,
        [id],
      );

      return row ? toText(row) : undefined;
    },

    async insert({ id, title, description, text, allowShowingFirstLetters, allowShowingText }) {
      await db.query(
        `INSERT INTO texts (id, title, description, text, "allowShowingFirstLetters", "allowShowingText")
           VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, title, description ?? null, text, allowShowingFirstLetters, allowShowingText],
      );
    },
  };
}

// A text without a description has no description key, where the column holds null
function toText({ description, ...row }: TextRow): Text {
  return description === null ? row : { ...row, description };
}

import { applyDbMigrations, DbSettings, openPostgres } from "./postgres.js";
import { newTextStore, TextRecord } from "./textStore.js";

/** Means an open connection pool to the server's database. */
export type Db = {
  /** Reads and adds rows of the `texts` table. */
  texts: {
    /** Returns the text with `id`, or undefined when there is none. */
    getById(id: string): Promise<TextRecord | undefined>;
    insert(record: TextRecord): Promise<void>;
  };
  /** Applies the migrations the database has not run yet. */
  migrate(): Promise<void>;
  /** Closes the connection pool. */
  close(): Promise<void>;
};

/** Connects to the database that `settings` names. */
export async function openDb(settings: DbSettings): Promise<Db> {
  const dataSource = await openPostgres(settings);

  return {
    texts: newTextStore(dataSource),
    migrate: () => applyDbMigrations(dataSource),
    close: () => dataSource.destroy(),
  };
}

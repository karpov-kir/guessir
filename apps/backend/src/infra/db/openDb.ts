import { applyDbMigrations, checkDbMigrated, DbSettings, openPostgres } from "./postgres.js";
import { type Query, queryOf } from "./query.js";

/** Means an open connection pool to the server's database. */
export type Db = {
  query: Query;
  /** Applies the migrations the database has not run yet. */
  migrate(): Promise<void>;
  /**
   * Throws unless the database has run every migration of this code and no contract migration
   * this code does not know, and writes nothing.
   */
  checkMigrated(): Promise<void>;
  /** Closes the connection pool. */
  close(): Promise<void>;
};

/** Connects to the database that `settings` names. */
export async function openDb(settings: DbSettings): Promise<Db> {
  const dataSource = await openPostgres(settings);

  return {
    query: queryOf(dataSource),
    migrate: () => applyDbMigrations(dataSource),
    checkMigrated: () => checkDbMigrated(dataSource),
    close: () => dataSource.destroy(),
  };
}

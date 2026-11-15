import { DataSource, QueryFailedError } from "typeorm";

import { applyDbMigrations, checkDbMigrated, DbSettings, openPostgres } from "./postgres.js";
import { QueryError } from "./QueryError.js";

/** Runs one SQL statement with its parameters and returns its rows. Throws a QueryError when the database refuses it. */
export type Query = <T = unknown>(sql: string, parameters?: unknown[]) => Promise<T>;

/** Means an open connection pool to the server's database. */
export type Db = {
  query: Query;
  /** Runs `work` in one transaction, which rolls back if `work` throws. */
  transaction(work: (query: Query) => Promise<void>): Promise<void>;
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

/** Turns TypeORM's refusal of a query into the QueryError of this module, which keeps TypeORM in it. */
const toQueryError = (error: unknown) => {
  if (!(error instanceof QueryFailedError)) {
    return error;
  }

  // pg gives the SQLSTATE in `code` as a string
  const driverError: unknown = error.driverError;
  const code =
    typeof driverError === "object" &&
    driverError !== null &&
    "code" in driverError &&
    typeof driverError.code === "string"
      ? driverError.code
      : undefined;

  return new QueryError({ message: error.message, query: error.query, code });
};

/** Returns a query over `run` that throws a QueryError where TypeORM throws its own error. */
const newQuery =
  (run: Query): Query =>
  async <T>(sql: string, parameters?: unknown[]) => {
    try {
      return await run<T>(sql, parameters);
    } catch (error) {
      throw toQueryError(error);
    }
  };

/** Connects to the database that `settings` names. */
export async function openDb(settings: DbSettings): Promise<Db> {
  const dataSource: DataSource = await openPostgres(settings);

  return {
    query: newQuery((sql, parameters) => dataSource.query(sql, parameters)),
    transaction: (work) =>
      dataSource.transaction((manager) =>
        work(newQuery((sql, parameters) => manager.query(sql, parameters))),
      ),
    migrate: () => applyDbMigrations(dataSource),
    checkMigrated: () => checkDbMigrated(dataSource),
    close: () => dataSource.destroy(),
  };
}

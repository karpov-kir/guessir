import { DataSource, QueryFailedError } from "typeorm";

import { QueryError } from "./QueryError.js";

/**
 * Runs one SQL statement with its parameters and returns its rows. Throws a `QueryError` when the
 * database refuses it.
 */
export type Query = <T = unknown>(sql: string, parameters?: unknown[]) => Promise<T>;

/** Runs `work` in one transaction, which rolls back if `work` throws. */
export type Transaction = (work: (query: Query) => Promise<void>) => Promise<void>;

/** Turns TypeORM's refusal of a query into a `QueryError`, which keeps TypeORM in this folder. */
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

/** Returns a query over `run` that throws a `QueryError` where TypeORM throws its own error. */
const newQuery =
  (run: Query): Query =>
  async <T>(sql: string, parameters?: unknown[]) => {
    try {
      return await run<T>(sql, parameters);
    } catch (error) {
      throw toQueryError(error);
    }
  };

/** Returns the query of `dataSource`'s pool. */
export const queryOf = (dataSource: DataSource): Query =>
  newQuery((sql, parameters) => dataSource.query(sql, parameters));

/**
 * Returns transactions on `dataSource`. A refused statement throws a `QueryError`, the
 * transaction's own BEGIN and COMMIT included.
 */
export const transactionOf =
  (dataSource: DataSource): Transaction =>
  async (work) => {
    try {
      await dataSource.transaction((manager) =>
        work(newQuery((sql, parameters) => manager.query(sql, parameters))),
      );
    } catch (error) {
      throw toQueryError(error);
    }
  };

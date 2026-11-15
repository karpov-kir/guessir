/**
 * Means a query the database refused. It carries the query's SQL and the database's SQLSTATE code,
 * and keeps no list of the query's parameters, which hold the stored texts.
 */
export class QueryError extends Error {
  /** The SQL of the query, with placeholders where its parameters went. */
  readonly query: string;
  /** The SQLSTATE code the database answered, when it gave one. */
  readonly code: string | undefined;

  constructor({ message, query, code }: { message: string; query: string; code?: string }) {
    super(message);
    this.name = "QueryError";
    this.query = query;
    this.code = code;
  }
}

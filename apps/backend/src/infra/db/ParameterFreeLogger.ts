import { inspect } from "node:util";

import { Logger } from "typeorm";

import { Logger as AppLogger } from "../../shared/Logger.js";

/**
 * Logs TypeORM's failed queries, warnings, schema builds and migrations. The logger never writes a
 * query's parameters. The parameters carry the stored texts, which are the answers to the games.
 */
export class ParameterFreeLogger implements Logger {
  private readonly logger = AppLogger.root.scope("typeorm");

  logQuery() {
    // A successful query is not logged: its parameters carry the stored texts
  }

  logQueryError(error: string | Error, query: string) {
    this.logger.error(`Query failed: ${String(error)}; ${query}`);
  }

  logQuerySlow() {
    // A slow query is not logged: its parameters carry the stored texts
  }

  logSchemaBuild(message: string) {
    this.logger.info(message);
  }

  logMigration(message: string) {
    this.logger.info(message);
  }

  log(level: "log" | "info" | "warn", message: unknown) {
    if (level === "warn") {
      this.logger.warn(typeof message === "string" ? message : inspect(message));
    }
  }
}

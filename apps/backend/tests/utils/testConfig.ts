import type { Config } from "../../src/infra/env/exports.js";
import type { DbSettings } from "../../src/infra/db/exports.js";
import { LogFormat } from "../../src/infra/logger/exports.js";
import { LogLevel } from "@guessir/logger";
import { Environment } from "../../src/infra/env/exports.js";

/**
 * Returns a server config for a test, with the server on a free local port. The database is `db`,
 * or else a placeholder that no test connects to, for a test whose server never reaches its
 * database.
 */
export function testConfig(db?: DbSettings): Config {
  return {
    environment: Environment.Development,
    host: "127.0.0.1",
    port: 0,
    db: db ?? {
      host: "unused.invalid",
      port: 5432,
      username: "unused",
      passwordFile: "/unused",
      database: "unused",
    },
    log: { format: LogFormat.Pretty, level: LogLevel.Info },
    corsOrigins: ["https://web.test"],
  };
}

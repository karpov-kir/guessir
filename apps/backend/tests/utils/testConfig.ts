import type { ServerConfig } from "../../src/entrypoints/server/config.js";
import type { DbSettings } from "../../src/infra/db/exports.js";

/**
 * Returns a server config for a test. The server listens on a free local port. Its database is
 * `db`, or else one no test reaches, for a server built over fake text rows.
 */
export function testConfig(db?: DbSettings): ServerConfig {
  return {
    host: "127.0.0.1",
    port: 0,
    db: db ?? {
      host: "unused.invalid",
      port: 5432,
      username: "unused",
      passwordFile: "/unused",
      database: "unused",
    },
  };
}

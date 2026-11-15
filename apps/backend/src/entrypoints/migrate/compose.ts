import { newDbPing, openDb } from "../../infra/db/exports.js";
import { readEnv } from "../../infra/env.js";
import { newLogSink } from "../../infra/logger/exports.js";
import { systemClock } from "../../infra/systemClock.js";
import type { Clock } from "../../shared/Clock.js";
import { Logger, LogLevel, type LogSink, newConsoleSink } from "@guessir/logger";
import { parseConfig, type ServerConfig } from "../server/config.js";
import { waitForDbAtStart } from "../../shared/dbWatch.js";

const logger = Logger.root.scope("migrate");

export type MigrateOverrides = {
  /** Stands in for the config the environment holds. */
  config?: ServerConfig;
  clock?: Clock;
  /**
   * Takes the log records in place of both sinks that `compose` installs, so a test can read or
   * drop them.
   */
  logSink?: LogSink;
};

export type MigrateHandle = {
  /**
   * Waits until the database answers, applies the migrations it has not run yet and closes its
   * connections. Throws when the database stays silent or a migration fails, and throws before it
   * writes when the database holds a contract migration this code does not know.
   */
  run(): Promise<void>;
};

/**
 * Builds the step that migrates the server's database, from the same config as the server. Installs
 * the log sinks and parses the config at once, so an invalid config throws here.
 */
export function compose(overrides: MigrateOverrides = {}): MigrateHandle {
  const clock = overrides.clock ?? systemClock;

  // This call installs a console sink before the config is parsed, so a parse error still reaches a
  // log. The second call reads the format from the config.
  Logger.install(overrides.logSink ?? newConsoleSink({ clock }), LogLevel.Info);
  const config = overrides.config ?? parseConfig(readEnv());
  Logger.install(overrides.logSink ?? newLogSink(config.log.format, { clock }), config.log.level);

  return {
    async run() {
      const dbPing = newDbPing(config.db);

      try {
        await waitForDbAtStart({ ping: dbPing.ping, clock });
      } finally {
        await dbPing.close();
      }

      const db = await openDb(config.db);

      try {
        logger.info(`Applying DB migrations to ${config.db.database} on ${config.db.host}`);
        await db.migrate();
        logger.info("DB is migrated");
      } finally {
        await db.close();
      }
    },
  };
}

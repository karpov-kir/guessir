import { Logger } from "@nestjs/common";

import { newDbPing, openDb } from "../../infra/db/exports.js";
import { readEnv } from "../../infra/env.js";
import { systemClock } from "../../infra/systemClock.js";
import type { Clock } from "../../shared/Clock.js";
import { parseConfig, type ServerConfig } from "../server/config.js";
import { errorText, pingEveryMs, startupWaitMs, waitForDb } from "../server/dbWatch.js";

const logger = new Logger("migrate");

export type MigrateOverrides = {
  /** Stands in for the config the environment holds. */
  config?: ServerConfig;
  clock?: Clock;
};

export type MigrateHandle = {
  /**
   * Waits until the database answers, applies the migrations it has not run yet and closes its
   * connections. Throws when the database stays silent or a migration fails.
   */
  run(): Promise<void>;
};

/** Builds the step that migrates the server's database, from the same config as the server. */
export function compose(overrides: MigrateOverrides = {}): MigrateHandle {
  const config = overrides.config ?? parseConfig(readEnv());
  const clock = overrides.clock ?? systemClock;

  return {
    async run() {
      const dbPing = newDbPing(config.db);

      try {
        await waitForDb({
          ping: dbPing.ping,
          clock,
          limitMs: startupWaitMs,
          intervalMs: pingEveryMs,
        }).catch((error: unknown) => {
          throw new Error(`DB did not answer for ${startupWaitMs}ms: ${errorText(error)}`);
        });
      } finally {
        await dbPing.close();
      }

      const db = await openDb(config.db);

      try {
        logger.log(`Applying DB migrations to ${config.db.database} on ${config.db.host}`);
        await db.migrate();
        logger.log("DB is migrated");
      } finally {
        await db.close();
      }
    },
  };
}

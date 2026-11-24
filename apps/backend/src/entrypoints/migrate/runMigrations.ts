// Coverage skips the process lifecycle: it exits the process, which a test cannot host. compose()'s
// tests cover the migration.
/* v8 ignore start */

import { errorText } from "#/shared/errorText.js";
import { Logger } from "@guessir/logger";
import { compose } from "./compose.js";

const logger = Logger.root.scope("migrate");

/**
 * Migrates the database the environment names, then lets the process end. Exits the process with 1
 * when the config is invalid, the database stays unreachable or a migration fails.
 */
export async function runMigrations() {
  try {
    await compose().run();
  } catch (error) {
    logger.error(`Failed to migrate: ${errorText(error)}`);
    process.exit(1);
  }
}

/* v8 ignore stop */

/*
 * v8 ignore start
 */

import "reflect-metadata";
import { Logger } from "@nestjs/common";

import { createDbPing } from "./dbUtils.js";
import { errorText, waitForDb, watchDb } from "./dbWatch.js";
import { MainModule } from "./MainModule.js";
import { newApp } from "./newApp.js";

// The server waits for the database at start. A postgres:17 patch deploy restarts the database, and
// a task that exits at once pauses the Swarm rolling update. After `lostAfterMs` without the
// database, the server exits, so Swarm starts a new container with fresh connections and name
// lookups.
const startupWaitMs = 60_000;
const lostAfterMs = 30_000;
const pingEveryMs = 1_000;

const logger = new Logger("server");

/**
 * Starts the server once the database answers, and exits the process when the database stays
 * unreachable.
 */
export async function boot(host = "0.0.0.0", port = 3020) {
  const pingDb = createDbPing();
  await waitForDb(pingDb, { limitMs: startupWaitMs, intervalMs: pingEveryMs }).catch(
    (error: unknown) => {
      logger.error(`DB did not answer for ${startupWaitMs}ms: ${errorText(error)}`);
      process.exit(1);
    },
  );

  const app = await newApp(MainModule);

  await app.listen(port, host);

  void watchDb(pingDb, { limitMs: lostAfterMs, intervalMs: pingEveryMs }).then((error) => {
    logger.error(`DB has been unreachable for ${lostAfterMs}ms: ${errorText(error)}`);
    process.exit(1);
  });
}

/*
 * v8 ignore stop
 */

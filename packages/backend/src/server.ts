/* v8 ignore start */

import "reflect-metadata";
import { Logger } from "@nestjs/common";

import { createDbPing } from "./dbUtils.js";
import { waitForDb, watchDb } from "./dbWatch.js";
import { MainModule } from "./MainModule.js";
import { newApp } from "./newApp.js";

// The server waits for the database at start, because a deploy of a new postgres:17 patch restarts it, and a new task
// that exits at once pauses the rolling update. Once the database is gone for `lostAfterMs`, the server exits so Swarm
// starts a new task in a new container, which does not rely on old connections or name lookups recovering.
const startupWaitMs = 60_000;
const lostAfterMs = 30_000;
const pingEveryMs = 1_000;

const logger = new Logger("server");

/** Starts the server once the database answers, and exits the process when the database stays unreachable. */
export async function boot(host = "0.0.0.0", port = 3020) {
  const pingDb = createDbPing();
  await waitForDb(pingDb, { limitMs: startupWaitMs, intervalMs: pingEveryMs }).catch(
    (error: unknown) => {
      logger.error(`DB did not answer for ${startupWaitMs}ms: ${String(error)}`);
      process.exit(1);
    },
  );

  const app = await newApp(MainModule);

  await app.listen(port, host);

  void watchDb(pingDb, { limitMs: lostAfterMs, intervalMs: pingEveryMs }).then((error) => {
    logger.error(`DB has been unreachable for ${lostAfterMs}ms: ${String(error)}`);
    process.exit(1);
  });
}

/* v8 ignore stop */

// Coverage skips the process lifecycle: it waits on a live database and exits the process, which a test
// cannot host. dbWatch's tests cover the waiting, and compose()'s tests cover the server.
/* v8 ignore start */

import { Logger } from "@nestjs/common";

import { createDbPing } from "../../dbUtils.js";
import { errorText, waitForDb, watchDb } from "../../dbWatch.js";
import { compose } from "./compositionRoot.js";

// The server waits for the database at start. A deploy of a Postgres patch release restarts the
// database, and a task that exits at once pauses the Swarm rolling update. After `lostAfterMs`
// without the database, the server exits, so Swarm starts a new container with fresh connections
// and name lookups.
const startupWaitMs = 60_000;
const lostAfterMs = 30_000;
const pingEveryMs = 1_000;

const logger = new Logger("server");

/**
 * Starts the server on HOST and PORT once the database answers, and exits the process when the
 * database stays unreachable.
 */
export async function startServer() {
  const host = process.env.HOST ?? "0.0.0.0";
  const port = process.env.PORT ? Number.parseInt(process.env.PORT) : 3020;
  const pingDb = createDbPing();

  await waitForDb(pingDb, { limitMs: startupWaitMs, intervalMs: pingEveryMs }).catch(
    (error: unknown) => {
      logger.error(`DB did not answer for ${startupWaitMs}ms: ${errorText(error)}`);
      process.exit(1);
    },
  );

  const server = await compose();

  await server.start(host, port);

  void watchDb(pingDb, { limitMs: lostAfterMs, intervalMs: pingEveryMs }).then((error) => {
    logger.error(`DB has been unreachable for ${lostAfterMs}ms: ${errorText(error)}`);
    process.exit(1);
  });
}

/* v8 ignore stop */

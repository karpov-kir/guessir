// Coverage skips the process lifecycle: it waits on a live database and exits the process, which a test
// cannot host. dbWatch's tests cover the waiting, and compose()'s tests cover the server.
/* v8 ignore start */

import { Logger } from "@nestjs/common";

import { createDbPing } from "../../infra/db/exports.js";
import { errorText, waitForDb, watchDb } from "./dbWatch.js";
import { compose, type ServerHandle } from "./compositionRoot.js";
import { stopOnSignals } from "./stopOnSignals.js";

// The server waits for the database at start. A deploy of a Postgres patch release restarts the
// database, and a task that exits at once pauses the Swarm rolling update. After `lostAfterMs`
// without the database, the server exits, so Swarm starts a new container with fresh connections
// and name lookups.
const startupWaitMs = 60_000;
const lostAfterMs = 30_000;
const pingEveryMs = 1_000;

const logger = new Logger("server");

/**
 * Starts the server on HOST and PORT once the database answers. Exits the
 * process when the database stays unreachable. Stops the server and exits
 * on SIGTERM or SIGINT.
 */
export async function startServer() {
  const host = process.env.HOST ?? "0.0.0.0";
  const port = process.env.PORT ? Number.parseInt(process.env.PORT) : 3020;
  const pingDb = createDbPing();
  let server: ServerHandle | undefined;

  // The signal handlers go in before the database wait, so SIGTERM or SIGINT
  // during that wait also ends the process.
  stopOnSignals({ stop: async () => server?.stop() });

  await waitForDb(pingDb, { limitMs: startupWaitMs, intervalMs: pingEveryMs }).catch(
    (error: unknown) => {
      logger.error(`DB did not answer for ${startupWaitMs}ms: ${errorText(error)}`);
      process.exit(1);
    },
  );

  server = await compose();

  await server.start(host, port);

  void watchDb(pingDb, { limitMs: lostAfterMs, intervalMs: pingEveryMs }).then((error) => {
    logger.error(`DB has been unreachable for ${lostAfterMs}ms: ${errorText(error)}`);
    process.exit(1);
  });
}

/* v8 ignore stop */

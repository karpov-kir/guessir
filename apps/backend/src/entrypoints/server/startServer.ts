// Coverage skips the process lifecycle: it exits the process, which a test cannot host. compose()'s
// tests cover the server, and dbWatch's tests cover the waiting.
/* v8 ignore start */

import { Logger } from "@nestjs/common";

import { errorText } from "../../shared/errorText.js";
import { compose, type ServerHandle } from "./compose.js";
import { stopOnSignals } from "./stopOnSignals.js";

const logger = new Logger("server");

/**
 * Builds the server from the environment and starts it once the database answers. Exits the
 * process when the config is invalid or the database stays unreachable. Stops the server and
 * exits on SIGTERM or SIGINT.
 */
export async function startServer() {
  let server: ServerHandle | undefined;

  // The signal handlers go in before compose() waits for the database, so SIGTERM or SIGINT
  // during that wait also ends the process.
  stopOnSignals({ stop: async () => server?.stop() });

  server = await compose().catch((error: unknown) => {
    logger.error(`Failed to start: ${errorText(error)}`);
    process.exit(1);
  });

  await server.start();
}

/* v8 ignore stop */

// Coverage skips the launcher: importing it starts the server, so tests reach the server through compose()
/* v8 ignore start */

import { startServer } from "./startServer.js";

await startServer();

/* v8 ignore stop */

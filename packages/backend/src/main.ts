/* v8 ignore start */

import { boot } from "./server.js";

void boot(process.env.HOST, process.env.PORT ? Number.parseInt(process.env.PORT) : undefined);

/* v8 ignore stop */

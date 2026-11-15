// Coverage skips the launcher: importing it migrates the database, so tests reach it through compose()
/* v8 ignore start */

import { runMigrations } from "./runMigrations.js";

await runMigrations();

/* v8 ignore stop */

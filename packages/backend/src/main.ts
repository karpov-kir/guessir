/* v8 ignore start */

import { boot } from './server';

boot(process.env.HOST, process.env.PORT ? parseInt(process.env.PORT) : undefined);

/* v8 ignore stop */

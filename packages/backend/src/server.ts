/* v8 ignore start */

import 'reflect-metadata';

import fastifyHelmet from '@fastify/helmet';
import { Logger, NotAcceptableException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { createDbPing } from './dbUtils';
import { waitForDb, watchDb } from './dbWatch';
import { MainModule } from './MainModule';

// The server waits for the database at start, because a deploy of a new postgres:17 patch restarts it, and a new task
// that exits at once pauses the rolling update. Once the database is gone for `lostAfterMs`, the server exits so Swarm
// starts a new task in a new container, which does not rely on old connections or name lookups recovering.
const startupWaitMs = 60_000;
const lostAfterMs = 30_000;
const pingEveryMs = 1_000;

const logger = new Logger('server');

export async function boot(host = '0.0.0.0', port = 3020) {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://guessir.k-k.local',
    'https://guessir.kk-forge.com',
  ];
  const pingDb = createDbPing();
  await waitForDb(pingDb, { limitMs: startupWaitMs, intervalMs: pingEveryMs }).catch((error: unknown) => {
    logger.error(`DB did not answer for ${startupWaitMs}ms: ${String(error)}`);
    process.exit(1);
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    MainModule,
    new FastifyAdapter({
      logger: true,
      // Fastify answers HEAD with the GET handler, which would read a text outside the rate limit set for GET
      exposeHeadRoutes: false,
    }),
  );

  await app.register(fastifyHelmet);

  app.enableCors({
    origin: (origin, callback) => {
      const isAllowed = !origin || allowedOrigins.includes(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new NotAcceptableException('Not allowed by CORS'), false);
      }
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      // If set to true, validator will strip validated (returned) object of any properties that do not use any validation decorators
      whitelist: true,
      // With the auto-transformation option enabled, the ValidationPipe will also perform conversion of primitive types
      transform: false,
      // If set to true, instead of stripping non-whitelisted properties validator will throw an exception
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(port, host);

  void watchDb(pingDb, { limitMs: lostAfterMs, intervalMs: pingEveryMs }).then((error) => {
    logger.error(`DB has been unreachable for ${lostAfterMs}ms: ${String(error)}`);
    process.exit(1);
  });
}

/* v8 ignore stop */

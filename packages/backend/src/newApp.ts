import fastifyHelmet from '@fastify/helmet';
import { NotAcceptableException, ValidationPipe } from '@nestjs/common';
import { IEntryNestModule, NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { QueryErrorFilter } from './QueryErrorFilter.js';

/** Creates the HTTP app of `module` as the server runs it: routing, headers, validation and failed-query handling. */
export async function newApp(module: IEntryNestModule, { logger = true } = {}) {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://guessir.k-k.local',
    'https://guessir.kk-forge.com',
  ];
  const app = await NestFactory.create<NestFastifyApplication>(
    module,
    new FastifyAdapter({
      logger,
      // This option stops Fastify from adding a HEAD route for each GET route.
      // A HEAD request would run the GET handler and read a text outside the rate limit set for GET.
      exposeHeadRoutes: false,
    }),
    logger ? undefined : { logger: false },
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
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new QueryErrorFilter());

  return app;
}

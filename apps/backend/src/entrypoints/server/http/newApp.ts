import fastifyHelmet from "@fastify/helmet";
import { NotAcceptableException } from "@nestjs/common";
import { IEntryNestModule, NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";

import { TextErrorFilter } from "./TextErrorFilter.js";
import { QueryErrorFilter } from "./QueryErrorFilter.js";

export type AppOptions = {
  /** The Nest module that holds the controllers and their providers. */
  module: IEntryNestModule;
  /** Turns Fastify's request log and Nest's log on. */
  logger: boolean;
};

/**
 * Creates the HTTP app of `module` with the server's headers, CORS and query error
 * handling, and returns it without listening.
 */
export async function newApp({ module, logger }: AppOptions) {
  const allowedOrigins = new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://guessir.kk-forge.com",
  ]);
  const app = await NestFactory.create<NestFastifyApplication>(
    module,
    new FastifyAdapter({
      logger,
      // This option stops Fastify from adding a HEAD route for each GET route. A HEAD request would
      // run the GET handler and read a text outside the rate limit that the proxy in front of the
      // API sets for GET.
      exposeHeadRoutes: false,
    }),
    logger ? undefined : { logger: false },
  );

  await app.register(fastifyHelmet);

  app.enableCors({
    origin: (origin, callback) => {
      const isAllowed = !origin || allowedOrigins.has(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new NotAcceptableException("Not allowed by CORS"), false);
      }
    },
  });

  app.useGlobalFilters(new QueryErrorFilter(), new TextErrorFilter());

  return app;
}

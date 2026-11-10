import fastifyHelmet from "@fastify/helmet";
import { NotAcceptableException, ValidationPipe } from "@nestjs/common";
import { IEntryNestModule, NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";

import { QueryErrorFilter } from "./QueryErrorFilter.js";

// Fastify's default serializers log a request's client address and host. These build each log's
// request and response from their method, URL and status only, so no log holds a visitor's IP, even
// with `trustProxy` on.
const serializers = {
  req: ({ method, url }: { method: string; url: string }) => ({ method, url }),
  res: ({ statusCode }: { statusCode: number }) => ({ statusCode }),
};

/**
 * Creates the HTTP app of `module` with the server's headers, CORS, validation and query error
 * handling, and returns it without listening. A `logger` object sets Fastify's logger options.
 */
export async function newApp(
  module: IEntryNestModule,
  { logger = true }: { logger?: boolean | { stream: { write(line: string): void } } } = {},
) {
  const allowedOrigins = new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://guessir.kk-forge.com",
  ]);
  const app = await NestFactory.create<NestFastifyApplication>(
    module,
    new FastifyAdapter({
      logger: logger && { ...(logger === true ? {} : logger), serializers },
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

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new QueryErrorFilter());

  return app;
}

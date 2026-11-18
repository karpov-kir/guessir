import { Module } from "@nestjs/common";
import type { InjectOptions, LightMyRequestResponse } from "fastify";

import { HealthController } from "./http/HealthController.js";
import { TextsController } from "./http/TextsController.js";
import { newTextsUseCases, TextsUseCases, type TextRows } from "../../features/texts/exports.js";
import { newTextStore } from "../../features/texts/infra/exports.js";
import { type Db, type DbPing, newDbPing, openDb } from "../../infra/db/exports.js";
import { logFormatOf, parseConfig, readEnv, type Config } from "../../infra/env/exports.js";
import { LogFormat, newLogSink } from "../../infra/logger/exports.js";
import { systemClock } from "../../infra/systemClock.js";
import { systemIds } from "../../infra/systemIds.js";
import type { Clock } from "../../shared/Clock.js";
import type { IdGenerator } from "../../shared/IdGenerator.js";
import { Logger, LogLevel, type LogSink } from "@guessir/logger";
import { pingEveryMs, waitForDbAtStart, watchDb } from "../../shared/dbWatch.js";
import { errorText } from "../../shared/errorText.js";
import { newApp } from "./http/newApp.js";

// After `lostAfterMs` without the database, the server exits, so Swarm starts a new container with
// fresh connections and name lookups.
const lostAfterMs = 30_000;

const logger = Logger.root.scope("server");

export type ServerOverrides = {
  /**
   * Stands in for the database: a server built with it opens no connection, checks no migration
   * and watches no database.
   */
  textRows?: TextRows;
  /** Stands in for the process environment, so `compose` reads no env file. */
  env?: Readonly<Record<string, string | undefined>>;
  /** Stands in for the config the environment holds. */
  config?: Config;
  clock?: Clock;
  ids?: IdGenerator;
  /** Runs once the database has been lost for good. By default it exits the process with 1. */
  onDbLost?: (error: unknown) => void;
  /**
   * Takes the log records in place of both sinks that `compose` installs, so a test can read or
   * drop them.
   */
  logSink?: LogSink;
  /** Stands in for the sink of a log format, so a test can read which format a record took. */
  logSinks?: Partial<Record<LogFormat, LogSink>>;
};

export type ServerHandle = {
  /** Listens on the configured host and port, and watches the database. */
  start(): Promise<void>;
  stop(): Promise<void>;
  /** Answers one request in process, the way a request on the socket is answered. */
  handle(request: InjectOptions): Promise<LightMyRequestResponse>;
};

/** Watches the database in the background and calls `onDbLost` once it is lost for good. */
function watchUntilLost({
  dbPing,
  clock,
  signal,
  onDbLost,
}: {
  dbPing: DbPing;
  clock: Clock;
  signal: AbortSignal;
  onDbLost: (error: unknown) => void;
}) {
  void watchDb({
    ping: dbPing.ping,
    clock,
    limitMs: lostAfterMs,
    intervalMs: pingEveryMs,
    signal,
  }).then((error) => {
    if (error !== undefined) {
      onDbLost(error);
    }
  });
}

const exitOnDbLost = (error: unknown) => {
  logger.error(`DB has been unreachable for ${lostAfterMs}ms: ${errorText(error)}`);
  process.exit(1);
};

/**
 * Builds the HTTP server and the texts feature over the database, or over `overrides.textRows`.
 * Waits until the database answers. Throws when the config is invalid, the database stays silent,
 * lacks a migration, or holds a contract migration that the server does not know. Returns the
 * handle without listening.
 */
export async function compose(overrides: ServerOverrides = {}): Promise<ServerHandle> {
  const clock = overrides.clock ?? systemClock;

  const sinkOf = (format: LogFormat) =>
    overrides.logSink ?? overrides.logSinks?.[format] ?? newLogSink(format, { clock });
  const { env, file } = overrides.env ? { env: overrides.env, file: undefined } : readEnv();

  // The first sink takes the records until the config parses, so a config error is logged
  Logger.install(sinkOf(logFormatOf(env)), LogLevel.Info);
  logger.info(file ? `Read the env file ${file}` : "Read no env file");
  const config = overrides.config ?? parseConfig(env);
  Logger.install(sinkOf(config.log.format), config.log.level);

  const onDbLost = overrides.onDbLost ?? exitOnDbLost;
  let dbPing: DbPing | undefined;
  let db: Db | undefined;

  logger.info(
    `Config: ${config.environment}, listens on ${config.host}:${config.port}, ` +
      `DB ${config.db.username}@${config.db.host}:${config.db.port}/${config.db.database}`,
  );

  try {
    let textRows = overrides.textRows;

    if (!textRows) {
      dbPing = newDbPing(config.db);
      await waitForDbAtStart({ ping: dbPing.ping, clock });
      db = await openDb(config.db);
      // The migrate step migrates the database. The server runs no migration and refuses a
      // database short of one.
      await db.checkMigrated();
      textRows = newTextStore({ db });
    }

    const texts = newTextsUseCases({ rows: textRows, ids: overrides.ids ?? systemIds });

    @Module({
      controllers: [HealthController, TextsController],
      providers: [{ provide: TextsUseCases, useValue: texts }],
    })
    class ServerModule {}

    const app = await newApp({ module: ServerModule, allowedOrigins: config.corsOrigins });
    const watch = new AbortController();

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    return {
      async start() {
        await app.listen(config.port, config.host);

        // A stop that came while the server began to listen leaves the database unwatched
        if (dbPing && !watch.signal.aborted) {
          watchUntilLost({ dbPing, clock, signal: watch.signal, onDbLost });
        }
      },
      async stop() {
        watch.abort();
        await app.close();
        await db?.close();
        await dbPing?.close();
      },
      handle: (request) => app.getHttpAdapter().getInstance().inject(request),
    };
  } catch (error) {
    // A server that fails to build closes what it opened, so an in-process caller leaks no pool
    await db?.close();
    await dbPing?.close();
    throw error;
  }
}

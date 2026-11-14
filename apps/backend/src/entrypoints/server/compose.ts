import { Logger, Module } from "@nestjs/common";
import type { InjectOptions, LightMyRequestResponse } from "fastify";

import { HealthController } from "./http/HealthController.js";
import { TextsController } from "./http/TextsController.js";
import { Texts, type TextRows } from "../../features/texts/exports.js";
import { type Db, type DbPing, newDbPing, openDb } from "../../infra/db/exports.js";
import { readEnv } from "../../infra/env.js";
import { systemClock } from "../../infra/systemClock.js";
import { systemIds } from "../../infra/systemIds.js";
import type { Clock } from "../../shared/Clock.js";
import type { IdGenerator } from "../../shared/IdGenerator.js";
import { parseConfig, type ServerConfig } from "./config.js";
import { pingEveryMs, waitForDbAtStart, watchDb } from "../../shared/dbWatch.js";
import { errorText } from "../../shared/errorText.js";
import { newApp } from "./http/newApp.js";

// After `lostAfterMs` without the database, the server exits, so Swarm starts a new container with
// fresh connections and name lookups.
const lostAfterMs = 30_000;

const logger = new Logger("server");

export type ServerOverrides = {
  /**
   * Stands in for the database: a server built with it opens no connection, checks no migration
   * and watches no database.
   */
  textRows?: TextRows;
  /** Stands in for the config the environment holds. */
  config?: ServerConfig;
  clock?: Clock;
  ids?: IdGenerator;
  /** Runs once the database has been lost for good. By default it exits the process with 1. */
  onDbLost?: (error: unknown) => void;
  /** Turns Fastify's request log and Nest's log off, for tests. */
  logger?: boolean;
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
 * Waits until the database answers. Throws when it stays silent, lacks a migration, or holds a
 * contract migration this code does not know. Returns the server's handle without listening.
 */
export async function compose(overrides: ServerOverrides = {}): Promise<ServerHandle> {
  const config = overrides.config ?? parseConfig(readEnv());
  const clock = overrides.clock ?? systemClock;
  const onDbLost = overrides.onDbLost ?? exitOnDbLost;
  let dbPing: DbPing | undefined;
  let db: Db | undefined;

  logger.log(
    `Config: listens on ${config.host}:${config.port}, ` +
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
      textRows = db.texts;
    }

    const texts = new Texts({ rows: textRows, ids: overrides.ids ?? systemIds });

    @Module({
      controllers: [HealthController, TextsController],
      providers: [{ provide: Texts, useValue: texts }],
    })
    class ServerModule {}

    const app = await newApp({ module: ServerModule, logger: overrides.logger ?? true });
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

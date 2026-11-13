import { Logger, Module } from "@nestjs/common";
import type { InjectOptions, LightMyRequestResponse } from "fastify";

import { HealthController } from "./http/HealthController.js";
import { TextsController } from "./http/TextsController.js";
import { Texts, type TextRows } from "../../features/texts/exports.js";
import { type Db, DbSettings, openDb } from "../../infra/db/exports.js";
import { newApp } from "./http/newApp.js";

const logger = new Logger("server");

export type ServerOverrides = {
  /** Stands in for the database: a server built with it opens no connection and runs no migration. */
  textRows?: TextRows;
  /** Connects to this database in place of the one the environment names. */
  dbSettings?: DbSettings;
  /** Turns Fastify's request log off, for tests. */
  logger?: boolean;
};

export type ServerHandle = {
  /** Applies the pending migrations, then listens on `host` and `port`. */
  start(host: string, port: number): Promise<void>;
  stop(): Promise<void>;
  /** Answers one request in process, the way a request on the socket is answered. */
  handle(request: InjectOptions): Promise<LightMyRequestResponse>;
};

/**
 * Builds the HTTP server and the texts feature over the database, or over `overrides.textRows`.
 * Returns the server's handle without listening.
 */
export async function compose(overrides: ServerOverrides = {}): Promise<ServerHandle> {
  let db: Db | undefined;
  let textRows = overrides.textRows;

  if (!textRows) {
    db = await openDb(overrides.dbSettings);
    textRows = db.texts;
  }

  @Module({
    controllers: [HealthController, TextsController],
    providers: [{ provide: Texts, useValue: new Texts(textRows) }],
  })
  class ServerModule {}

  const app = await newApp(ServerModule, { logger: overrides.logger ?? true });

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  return {
    async start(host, port) {
      if (db) {
        logger.log("Applying DB migrations");
        await db.migrate();
      }

      await app.listen(port, host);
    },
    async stop() {
      await app.close();
      await db?.close();
    },
    handle: (request) => app.getHttpAdapter().getInstance().inject(request),
  };
}

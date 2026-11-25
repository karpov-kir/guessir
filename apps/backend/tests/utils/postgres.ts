import { randomUUID } from "node:crypto";

import { inject } from "vitest";

import { compose as composeMigrate } from "#src/entrypoints/migrate/compose.js";
import { type Db, type DbSettings, openDb } from "#src/infra/db/exports.js";
import { silentSink } from "@guessir/logger/testing";
import { testConfig } from "./testConfig.js";

/** Means an empty database of a test's own, on the Postgres that the infra tests share. */
export type TestDatabase = {
  /** Names the database, with its password in a file, as the server reads it. */
  settings: DbSettings;
  /** Runs `sql` on the database as its owner, and returns the rows. */
  query<Row>(sql: string, parameters?: unknown[]): Promise<Row[]>;
  /** Drops the database, closing the connections any code left open on it. */
  drop(): Promise<void>;
};

/** Runs `sql` on the shared Postgres's own database, for the statements that make or drop one. */
async function onServer(sql: string) {
  const server = await openDb(inject("postgres"));

  try {
    await server.query(sql);
  } finally {
    await server.close();
  }
}

/** Makes an empty database on the shared Postgres. */
export async function newTestDatabase(): Promise<TestDatabase> {
  const database = `test_${randomUUID().replaceAll("-", "")}`;
  const settings = { ...inject("postgres"), database };
  // Every query shares the one connection pool that the first query opens
  let db: Promise<Db> | undefined;

  await onServer(`CREATE DATABASE "${database}"`);

  return {
    settings,
    async query<Row>(sql: string, parameters?: unknown[]) {
      db ??= openDb(settings);

      return (await db).query<Row[]>(sql, parameters);
    },
    async drop() {
      await (await db)?.close();
      db = undefined;
      await onServer(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
    },
  };
}

/** Makes a database on the shared Postgres and runs the migrate step on it, as a deploy does. */
export async function newMigratedTestDatabase(): Promise<TestDatabase> {
  const database = await newTestDatabase();

  await composeMigrate({ config: testConfig(database.settings), logSink: silentSink }).run();

  return database;
}

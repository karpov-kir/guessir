import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startMigratedPostgres, TestPostgres } from "../../../tests/utils/postgres.js";
import { Db, newDbPing, openDb, QueryError } from "./exports.js";

describe("the database on Postgres", () => {
  let postgres: TestPostgres;
  let db: Db;

  beforeAll(async () => {
    postgres = await startMigratedPostgres();
    db = await openDb(postgres.settings);
  }, 120_000);

  afterAll(async () => {
    await db?.close();
    await postgres?.stop();
  });

  it("should answer a query with its rows", async () => {
    expect(await db.query<{ answer: number }[]>("SELECT 1 + $1::int AS answer", [1])).toEqual([
      { answer: 2 },
    ]);
  });

  it("should refuse a bad query with its SQL and code, and keep no list of its parameters", async () => {
    const error = await db.query("SELECT 1 / $1::int", [0]).catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(QueryError);
    expect(error).toMatchObject({
      message: "division by zero",
      query: "SELECT 1 / $1::int",
      code: "22012",
    });
    expect(error).not.toHaveProperty("parameters");
  });

  it("should answer a ping while the database is up", async () => {
    const dbPing = newDbPing(postgres.settings);

    await expect(dbPing.ping()).resolves.toBeUndefined();
    await dbPing.close();
  });
});

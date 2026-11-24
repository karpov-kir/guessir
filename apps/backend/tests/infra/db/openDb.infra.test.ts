import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Logger, LogLevel } from "@guessir/logger";
import { collectLogs } from "@guessir/logger/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { newMigratedTestDatabase, TestDatabase } from "#tests/utils/postgres.js";
import { Db, newDbPing, openDb, QueryError } from "#/infra/db/exports.js";

const hiddenTitle = "the hidden text";
const hiddenTextId = "hidden".padEnd(20, "x");

describe("the database on Postgres", () => {
  let postgres: TestDatabase;
  let db: Db;

  beforeAll(async () => {
    postgres = await newMigratedTestDatabase();
    db = await openDb(postgres.settings);
  }, 120_000);

  afterAll(async () => {
    await db?.close();
    await postgres?.drop();
  });

  describe("password file", () => {
    let passwordDir: string;

    beforeAll(() => {
      passwordDir = mkdtempSync(join(tmpdir(), "guessir-password-"));
    });

    afterAll(() => {
      rmSync(passwordDir, { recursive: true, force: true });
    });

    it("should connect with the password from its file, trimmed of the line end", async () => {
      const passwordFile = join(passwordDir, "password");
      writeFileSync(passwordFile, `${readFileSync(postgres.settings.passwordFile, "utf8")}\n`);
      const trimmed = await openDb({ ...postgres.settings, passwordFile });

      try {
        expect(await trimmed.query<{ answer: number }[]>("SELECT 1 AS answer")).toEqual([
          { answer: 1 },
        ]);
      } finally {
        await trimmed.close();
      }
    });

    it("should throw when the password file cannot be read", async () => {
      const passwordFile = join(passwordDir, "missing");

      await expect(openDb({ ...postgres.settings, passwordFile })).rejects.toThrow(
        `Failed to read the database password file (${passwordFile})`,
      );
    });
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
      message: "SQLSTATE 22012",
      query: "SELECT 1 / $1::int",
      code: "22012",
    });
    expect(error).not.toHaveProperty("parameters");
  });

  it.each([
    ["a parameter cast to a number", "SELECT $1::int", [hiddenTitle]],
    [
      "a stored text cast to a number",
      "SELECT title::int FROM texts WHERE id = $1",
      [hiddenTextId],
    ],
  ])("should keep the value out of the error and the log on %s", async (_, sql, parameters) => {
    const logs = collectLogs();

    Logger.install(logs.sink, LogLevel.Debug);
    await db.query(
      `INSERT INTO texts (id, title, text, "allowShowingFirstLetters", "allowShowingText")
       VALUES ($1, $2, 'One two', true, true) ON CONFLICT DO NOTHING`,
      [hiddenTextId, hiddenTitle],
    );

    const error = await db.query(sql, parameters).catch((thrown: unknown) => thrown);

    expect(error).toMatchObject({ code: "22P02" });
    expect(String(error)).not.toContain(hiddenTitle);
    expect(JSON.stringify(logs.lines())).not.toContain(hiddenTitle);
    expect(logs.lines(LogLevel.Error)).not.toEqual([]);
  });

  it("should answer a ping while the database is up", async () => {
    const dbPing = newDbPing(postgres.settings);

    await expect(dbPing.ping()).resolves.toBeUndefined();
    await dbPing.close();
  });
});

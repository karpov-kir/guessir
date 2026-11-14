import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startPostgres, TestPostgres } from "../../../tests/utils/postgres.js";
import { Db, openDb } from "./openDb.js";
import { DbSettings, newDbPing, openPostgres } from "./postgres.js";
import { TextRecord } from "./textStore.js";

const record: TextRecord = {
  id: "aaaaaaaaaaaaaaaaaaaa",
  title: "Title",
  description: "Description",
  text: "One two",
  allowShowingFirstLetters: true,
  allowShowingText: false,
};

describe("the texts table on Postgres", () => {
  let postgres: TestPostgres;
  let settings: DbSettings;
  let db: Db;

  beforeAll(async () => {
    postgres = await startPostgres();
    settings = postgres.settings;
    db = await openDb(settings);
    await db.migrate();
  }, 120_000);

  afterAll(async () => {
    await db?.close();
    await postgres?.stop();
  });

  it("should apply each migration once", async () => {
    await db.migrate();

    // The test reads the migrations table over a connection of its own, as `Db` runs no raw query.
    // The name carries the file's extension: .ts when the tests run the sources, .js on the server
    const dataSource = await openPostgres(settings);
    const migrations = await dataSource.query<{ name: string }[]>("select name from migrations");

    await dataSource.destroy();

    expect(migrations.map(({ name }) => name.replace(/\.(ts|js)$/, ""))).toEqual([
      "2022-03-23-initial",
      "2026-11-14-blank-texts",
    ]);
  });

  it("should give back a stored text and nothing for an unknown id", async () => {
    await db.texts.insert(record);

    expect(await db.texts.getById(record.id)).toEqual(record);
    expect(await db.texts.getById("unknown")).toBeUndefined();
  });

  it("should give back a text stored without a description with no description", async () => {
    const { description: _, ...withoutDescription } = { ...record, id: "cccccccccccccccccccc" };

    await db.texts.insert(withoutDescription);

    expect(await db.texts.getById(withoutDescription.id)).toEqual(withoutDescription);
  });

  it("should refuse a second text with the same id", async () => {
    const id = "bbbbbbbbbbbbbbbbbbbb";

    await db.texts.insert({ ...record, id });

    await expect(db.texts.insert({ ...record, id })).rejects.toThrow(/duplicate key value/);
  });

  it("should answer a ping while the database is up", async () => {
    const dbPing = newDbPing(settings);

    await expect(dbPing.ping()).resolves.toBeUndefined();
    await dbPing.close();
  });
});

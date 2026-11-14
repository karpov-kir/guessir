import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startPostgres, TestPostgres } from "../../../tests/utils/postgres.js";
import { Db, openDb } from "./openDb.js";
import { DbSettings, newDbPing } from "./postgres.js";
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

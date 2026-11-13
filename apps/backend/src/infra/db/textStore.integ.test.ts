import { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startPostgres } from "../../../tests/utils/postgres.js";
import { Db, openDb } from "./openDb.js";
import { createDbPing, DbSettings, openPostgres } from "./postgres.js";
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
  let container: StartedPostgreSqlContainer;
  let settings: DbSettings;
  let db: Db;

  beforeAll(async () => {
    ({ container, settings } = await startPostgres());
    db = await openDb(settings);
    await db.migrate();
  }, 120_000);

  afterAll(async () => {
    await db?.close();
    await container?.stop();
  });

  it("should apply each migration once", async () => {
    await db.migrate();

    // The test reads the migrations table over a connection of its own, as `Db` runs no raw query.
    // The name carries the file's extension: .ts when the tests run the sources, .js on the server
    const dataSource = await openPostgres(settings);
    const migrations = await dataSource.query<{ name: string }[]>("select name from migrations");

    await dataSource.destroy();

    expect(migrations).toHaveLength(1);
    expect(migrations[0].name).toMatch(/^2022-03-23-initial\.(ts|js)$/);
  });

  it("should give back a stored text and nothing for an unknown id", async () => {
    await db.texts.insert(record);

    expect(await db.texts.getById(record.id)).toEqual(record);
    expect(await db.texts.getById("unknown")).toBeUndefined();
  });

  it("should refuse a second text with the same id", async () => {
    const id = "bbbbbbbbbbbbbbbbbbbb";

    await db.texts.insert({ ...record, id });

    await expect(db.texts.insert({ ...record, id })).rejects.toThrow(/duplicate key value/);
  });

  it("should answer a ping while the database is up", async () => {
    await expect(createDbPing(settings)()).resolves.toBeUndefined();
  });
});

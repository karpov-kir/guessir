import { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { DataSource } from "typeorm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startPostgres } from "../../../tests/utils/postgres.js";
import { applyDbMigrations, createDbPing, DbSettings, openPostgres } from "../../dbUtils.js";
import { newTextStore, TextRecord } from "./textStore.js";

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
  let dataSource: DataSource;

  beforeAll(async () => {
    ({ container, settings } = await startPostgres());
    dataSource = await openPostgres(settings);
    await applyDbMigrations(dataSource);
  }, 120_000);

  afterAll(async () => {
    await dataSource?.destroy();
    await container?.stop();
  });

  it("should apply each migration once", async () => {
    await applyDbMigrations(dataSource);

    // The name carries the file's extension: .ts when the tests run the sources, .js on the server
    expect(await dataSource.query("select name from migrations")).toEqual([
      { name: expect.stringMatching(/^2022-03-23-initial\.(ts|js)$/) },
    ]);
  });

  it("should give back a stored text and nothing for an unknown id", async () => {
    const store = newTextStore(dataSource);

    await store.insert(record);

    expect(await store.getById(record.id)).toEqual(record);
    expect(await store.getById("unknown")).toBeUndefined();
  });

  it("should refuse a second text with the same id", async () => {
    const store = newTextStore(dataSource);
    const id = "bbbbbbbbbbbbbbbbbbbb";

    await store.insert({ ...record, id });

    await expect(store.insert({ ...record, id })).rejects.toThrow();
  });

  it("should answer a ping while the database is up", async () => {
    await expect(createDbPing(settings)()).resolves.toBeUndefined();
  });
});

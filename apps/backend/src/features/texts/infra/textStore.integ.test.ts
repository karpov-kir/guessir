import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startMigratedPostgres, TestPostgres } from "../../../../tests/utils/postgres.js";
import { Db, openDb, QueryError } from "../../../infra/db/exports.js";
import type { Text, TextRows } from "../port.js";
import { newTextStore } from "./exports.js";

const text: Text = {
  id: "aaaaaaaaaaaaaaaaaaaa",
  title: "Title",
  description: "Description",
  text: "One two",
  allowShowingFirstLetters: true,
  allowShowingText: false,
};

describe("the texts table on Postgres", () => {
  let postgres: TestPostgres;
  let db: Db;
  let rows: TextRows;

  beforeAll(async () => {
    postgres = await startMigratedPostgres();
    db = await openDb(postgres.settings);
    rows = newTextStore({ db });
  }, 120_000);

  afterAll(async () => {
    await db?.close();
    await postgres?.stop();
  });

  it("should give back a stored text and nothing for an unknown id", async () => {
    await rows.insert(text);

    expect(await rows.getById(text.id)).toEqual(text);
    expect(await rows.getById("unknown")).toBeUndefined();
  });

  it("should give back a text stored without a description with no description key", async () => {
    const { description: _, ...withoutDescription } = { ...text, id: "cccccccccccccccccccc" };

    await rows.insert(withoutDescription);

    expect(await rows.getById(withoutDescription.id)).toEqual(withoutDescription);
  });

  it("should refuse a second text with the same id with the unique violation's code", async () => {
    const id = "bbbbbbbbbbbbbbbbbbbb";

    await rows.insert({ ...text, id });

    await expect(rows.insert({ ...text, id })).rejects.toThrow(
      expect.objectContaining({ name: "QueryError", code: "23505" }),
    );
    await expect(rows.insert({ ...text, id })).rejects.toBeInstanceOf(QueryError);
  });
});

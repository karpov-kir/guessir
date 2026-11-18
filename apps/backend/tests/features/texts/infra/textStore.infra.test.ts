import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { newMigratedTestDatabase, TestDatabase } from "../../../utils/postgres.js";
import { Db, openDb, QueryError } from "../../../../src/infra/db/exports.js";
import type { Text, TextRows } from "../../../../src/features/texts/exports.js";
import { newTextStore } from "../../../../src/features/texts/infra/exports.js";

const text: Text = {
  id: "aaaaaaaaaaaaaaaaaaaa",
  title: "Title",
  description: "Description",
  text: "One two",
  allowShowingFirstLetters: true,
  allowShowingText: false,
};

describe("the texts table on Postgres", () => {
  let postgres: TestDatabase;
  let db: Db;
  let rows: TextRows;

  beforeAll(async () => {
    postgres = await newMigratedTestDatabase();
    db = await openDb(postgres.settings);
    rows = newTextStore({ db });
  }, 120_000);

  afterAll(async () => {
    await db?.close();
    await postgres?.drop();
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
    const error = await rows.insert({ ...text, id }).catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(QueryError);
    expect(error).toMatchObject({ code: "23505" });
  });
});

import { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { DataSource } from "typeorm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { startPostgres } from "../../../tests/utils/postgres.js";
import { Db, openDb } from "./openDb.js";
import { openPostgres } from "./postgres.js";

interface Row {
  id: string;
  title: string;
  description: string | null;
  text: string;
}

// Each value is blank, or not, by `String.prototype.trim`, as the API reads it
const blankValues = ["", "   ", "\t\n\v\f\r", "        　﻿"];
const filledValues = ["About", " About ", "​"];

const row = (id: string, fields: Partial<Row> = {}): Row => ({
  id: id.padEnd(20, "x"),
  title: "Title",
  description: null,
  text: "One two",
  ...fields,
});

const rows: Row[] = [
  row("kept"),
  ...filledValues.map((description, index) => row(`filled${index}`, { description })),
  ...blankValues.map((description, index) => row(`blankdescription${index}`, { description })),
  ...blankValues.map((title, index) => row(`blanktitle${index}`, { title })),
  ...blankValues.map((text, index) => row(`blanktext${index}`, { text })),
];

const byId = (a: Row, b: Row) => (a.id < b.id ? -1 : 1);

const cleaned = rows
  .filter(({ title, text }) => title.trim() !== "" && text.trim() !== "")
  .map((stored) => ({
    ...stored,
    description: stored.description?.trim() === "" ? null : stored.description,
  }));

describe("the blank texts migration", () => {
  let container: StartedPostgreSqlContainer;
  let db: Db;
  let dataSource: DataSource;

  const storedRows = async () =>
    (await dataSource.query<Row[]>("SELECT id, title, description, text FROM texts")).toSorted(
      byId,
    );

  /** Forgets that the migration ran, so the next `migrate` runs it again. */
  const runMigrationAgain = async () => {
    await dataSource.query("DELETE FROM migrations WHERE name LIKE '2026-11-14-blank-texts.%'");
    await db.migrate();
  };

  beforeAll(async () => {
    const postgres = await startPostgres();

    container = postgres.container;
    db = await openDb(postgres.settings);
    await db.migrate();
    dataSource = await openPostgres(postgres.settings);
  }, 120_000);

  afterAll(async () => {
    await dataSource?.destroy();
    await db?.close();
    await container?.stop();
  });

  beforeEach(async () => {
    await dataSource.query("DELETE FROM texts");

    for (const { id, title, description, text } of rows) {
      await dataSource.query(
        `INSERT INTO texts (id, title, description, text, "allowShowingFirstLetters", "allowShowingText")
         VALUES ($1, $2, $3, $4, true, true)`,
        [id, title, description, text],
      );
    }
  });

  it("should take the values the API reads as blank and no others", () => {
    expect(blankValues.every((value) => value.trim() === "")).toBe(true);
    expect(filledValues.every((value) => value.trim() !== "")).toBe(true);
  });

  it("should delete a text with a blank title or text and clear a blank description", async () => {
    await runMigrationAgain();

    expect(await storedRows()).toEqual(cleaned.toSorted(byId));
  });

  it("should change nothing when it runs a second time", async () => {
    await runMigrationAgain();
    const once = await storedRows();

    await runMigrationAgain();

    expect(await storedRows()).toEqual(once);
  });

  it("should leave every row as it was when a statement fails", async () => {
    const before = await storedRows();

    await dataSource.query(`
      CREATE FUNCTION refuse_update() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'update refused'; END $$;
      CREATE TRIGGER refuse_update BEFORE UPDATE ON texts EXECUTE FUNCTION refuse_update();
    `);

    try {
      await expect(runMigrationAgain()).rejects.toThrow("update refused");
      expect(await storedRows()).toEqual(before);
    } finally {
      await dataSource.query(`
        DROP TRIGGER refuse_update ON texts;
        DROP FUNCTION refuse_update();
      `);
    }
  });
});

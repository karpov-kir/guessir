import { afterEach, describe, expect, it } from "vitest";

import { collectLogs, silentSink } from "@guessir/logger/testing";
import { newTestDatabase, TestDatabase } from "../../utils/postgres.js";
import { steppingClock } from "../../utils/steppingClock.js";
import { testConfig } from "../../utils/testConfig.js";
import { unreachableDbConfig } from "../../utils/unreachableDbConfig.js";
import { LogLevel, type LogSink } from "@guessir/logger";
import { compose as composeServer, ServerHandle } from "../../../src/entrypoints/server/compose.js";
import { compose } from "../../../src/entrypoints/migrate/compose.js";

describe("the migrate step", () => {
  let postgres: TestDatabase | undefined;
  let server: ServerHandle | undefined;
  let unreachable: ReturnType<typeof unreachableDbConfig> | undefined;

  const serverOver = (settings: TestDatabase["settings"], logSink: LogSink = silentSink) =>
    composeServer({ config: testConfig(settings), logSink });
  const migrateStep = (settings: TestDatabase["settings"], logSink: LogSink = silentSink) =>
    compose({ config: testConfig(settings), logSink });

  /** Returns the migrations the database has run, without their extensions, with their kinds. */
  const migrationRows = async (database: TestDatabase) => {
    const rows = await database.query<{ name: string; kind: string | null }>(
      "SELECT name, kind FROM migrations ORDER BY name",
    );

    return rows.map(({ name, kind }) => ({ name: name.replace(/\.(ts|js)$/, ""), kind }));
  };

  /** Records a migration from newer code in the database, of `kind`, or of no kind. */
  const recordNewerMigration = async (database: TestDatabase, kind: string | null) => {
    await database.query("INSERT INTO migrations (name, kind) VALUES ($1, $2)", [
      "2099-01-01-from-newer-code.js",
      kind,
    ]);
  };

  afterEach(async () => {
    await server?.stop();
    await postgres?.drop();
    unreachable?.remove();
    server = undefined;
    postgres = undefined;
    unreachable = undefined;
  });

  it("should migrate a new database, so the server, which refused it, then starts", async () => {
    postgres = await newTestDatabase();

    await expect(serverOver(postgres.settings)).rejects.toThrow(
      /^The database lacks the migrations 2022-03-23-initial, 2026-11-14-blank-texts: run the migrate step first$/,
    );

    await migrateStep(postgres.settings).run();
    server = await serverOver(postgres.settings);

    expect((await server.handle({ method: "GET", url: "/texts/unknown" })).statusCode).toBe(404);
  }, 120_000);

  it("should log each migration it applies as one line of text", async () => {
    postgres = await newTestDatabase();
    const logs = collectLogs();

    await migrateStep(postgres.settings, logs.sink).run();

    expect(
      logs
        .lines(LogLevel.Info)
        .filter(({ scope }) => scope[0] === "postgres")
        .map(({ args }) => args),
    ).toEqual([
      ["migrating 2022-03-23-initial.ts"],
      [expect.stringMatching(/^migrated 2022-03-23-initial\.ts in \d+(\.\d+)?s$/)],
      ["migrating 2026-11-14-blank-texts.ts"],
      [expect.stringMatching(/^migrated 2026-11-14-blank-texts\.ts in \d+(\.\d+)?s$/)],
    ]);
  }, 120_000);

  it("should apply each migration once and record its kind, even with two steps at once", async () => {
    postgres = await newTestDatabase();
    const step = migrateStep(postgres.settings);

    await Promise.all([step.run(), step.run()]);
    await step.run();

    expect(await migrationRows(postgres)).toEqual([
      { name: "2022-03-23-initial", kind: "expand" },
      { name: "2026-11-14-blank-texts", kind: "expand" },
    ]);
  }, 120_000);

  it.each(["contract", null])(
    "should refuse, as the server does, a database with a newer migration of kind %s",
    async (kind) => {
      postgres = await newTestDatabase();
      await migrateStep(postgres.settings).run();
      await recordNewerMigration(postgres, kind);
      const newerContract =
        /^The database holds the migrations 2099-01-01-from-newer-code, which this code does not know and which are contracts or record no kind: newer code changed it in a way this code cannot run on$/;

      await expect(migrateStep(postgres.settings).run()).rejects.toThrow(newerContract);
      await expect(serverOver(postgres.settings)).rejects.toThrow(newerContract);
    },
    120_000,
  );

  it("should run on, with a warning, a database with a newer expand migration", async () => {
    postgres = await newTestDatabase();
    await migrateStep(postgres.settings).run();
    await recordNewerMigration(postgres, "expand");
    const logs = collectLogs();
    const newerExpand =
      /^The database holds the expand migrations 2099-01-01-from-newer-code, which this code does not know: newer code migrated it, and this code runs on/;

    await migrateStep(postgres.settings, logs.sink).run();
    server = await serverOver(postgres.settings, logs.sink);

    expect((await server.handle({ method: "GET", url: "/texts/unknown" })).statusCode).toBe(404);
    // The migrate step and the server each warn once
    expect(
      logs
        .lines(LogLevel.Warn)
        .filter(({ args: [message] }) => typeof message === "string" && newerExpand.test(message)),
    ).toHaveLength(2);
  }, 120_000);

  it("should take a database that a release before migrations recorded a kind migrated", async () => {
    postgres = await newTestDatabase();
    await migrateStep(postgres.settings).run();
    // A release from before migrations recorded a kind made this table without the kind column.
    await postgres.query("ALTER TABLE migrations DROP COLUMN kind");

    server = await serverOver(postgres.settings);
    await server.stop();
    server = undefined;
    await migrateStep(postgres.settings).run();

    expect(await migrationRows(postgres)).toEqual([
      { name: "2022-03-23-initial", kind: null },
      { name: "2026-11-14-blank-texts", kind: null },
    ]);
  }, 120_000);

  it("should throw once the database has not answered for the startup wait", async () => {
    unreachable = unreachableDbConfig();
    const { config } = unreachable;

    await expect(
      compose({ config, clock: steppingClock(), logSink: silentSink }).run(),
    ).rejects.toThrow(/^DB did not answer for 60000ms: /);
  });
});

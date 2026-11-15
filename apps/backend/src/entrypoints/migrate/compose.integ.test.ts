import { Logger } from "@nestjs/common";
import { DataSource } from "typeorm";
import { afterEach, describe, expect, it, vi } from "vitest";

import { startPostgres, TestPostgres } from "../../../tests/utils/postgres.js";
import { steppingClock } from "../../../tests/utils/steppingClock.js";
import { testConfig } from "../../../tests/utils/testConfig.js";
import { unreachableDbConfig } from "../../../tests/utils/unreachableDbConfig.js";
import { openPostgres } from "../../infra/db/postgres.js";
import { compose as composeServer, ServerHandle } from "../server/compose.js";
import { compose } from "./compose.js";

describe("the migrate step", () => {
  let postgres: TestPostgres | undefined;
  let server: ServerHandle | undefined;
  let dataSource: DataSource | undefined;
  let unreachable: ReturnType<typeof unreachableDbConfig> | undefined;

  const serverOver = (settings: TestPostgres["settings"]) =>
    composeServer({ config: testConfig(settings), logger: false });

  /** Returns the migrations the database has run, without their extensions, with their kinds. */
  const migrationRows = async (settings: TestPostgres["settings"]) => {
    dataSource ??= await openPostgres(settings);
    const rows = await dataSource.query<{ name: string; kind: string | null }[]>(
      "SELECT name, kind FROM migrations ORDER BY name",
    );

    return rows.map(({ name, kind }) => ({ name: name.replace(/\.(ts|js)$/, ""), kind }));
  };

  /** Records a migration from newer code in the database, of `kind`, or of no kind. */
  const recordNewerMigration = async (settings: TestPostgres["settings"], kind: string | null) => {
    dataSource ??= await openPostgres(settings);
    await dataSource.query("INSERT INTO migrations (name, kind) VALUES ($1, $2)", [
      "2099-01-01-from-newer-code.js",
      kind,
    ]);
  };

  afterEach(async () => {
    vi.restoreAllMocks();
    await server?.stop();
    await dataSource?.destroy();
    await postgres?.stop();
    unreachable?.remove();
    server = undefined;
    dataSource = undefined;
    postgres = undefined;
    unreachable = undefined;
  });

  it("should migrate a new database, so the server, which refused it, then starts", async () => {
    postgres = await startPostgres();

    await expect(serverOver(postgres.settings)).rejects.toThrow(
      /^The database lacks the migrations 2022-03-23-initial, 2026-11-14-blank-texts: run the migrate step first$/,
    );

    await compose({ config: testConfig(postgres.settings) }).run();
    server = await serverOver(postgres.settings);

    expect((await server.handle({ method: "GET", url: "/texts/unknown" })).statusCode).toBe(404);
  }, 120_000);

  it("should apply each migration once and record its kind, even with two steps at once", async () => {
    postgres = await startPostgres();
    const step = compose({ config: testConfig(postgres.settings) });

    await Promise.all([step.run(), step.run()]);
    await step.run();

    expect(await migrationRows(postgres.settings)).toEqual([
      { name: "2022-03-23-initial", kind: "expand" },
      { name: "2026-11-14-blank-texts", kind: "expand" },
    ]);
  }, 120_000);

  it.each(["contract", null])(
    "should refuse, as the server does, a database with a newer migration of kind %s",
    async (kind) => {
      postgres = await startPostgres();
      await compose({ config: testConfig(postgres.settings) }).run();
      await recordNewerMigration(postgres.settings, kind);
      const newerContract =
        /^The database holds the migrations 2099-01-01-from-newer-code, which this code does not know and which are contracts or record no kind: newer code changed it in a way this code cannot run on$/;

      await expect(compose({ config: testConfig(postgres.settings) }).run()).rejects.toThrow(
        newerContract,
      );
      await expect(serverOver(postgres.settings)).rejects.toThrow(newerContract);
    },
    120_000,
  );

  it("should run on, with a warning, a database with a newer expand migration", async () => {
    postgres = await startPostgres();
    await compose({ config: testConfig(postgres.settings) }).run();
    await recordNewerMigration(postgres.settings, "expand");
    const warn = vi.spyOn(Logger.prototype, "warn");
    const newerExpand =
      /^The database holds the expand migrations 2099-01-01-from-newer-code, which this code does not know: newer code migrated it, and this code runs on/;

    await compose({ config: testConfig(postgres.settings) }).run();
    server = await serverOver(postgres.settings);

    expect((await server.handle({ method: "GET", url: "/texts/unknown" })).statusCode).toBe(404);
    // The migrate step and the server each warn once
    expect(
      warn.mock.calls.filter(
        ([message]) => typeof message === "string" && newerExpand.test(message),
      ),
    ).toHaveLength(2);
  }, 120_000);

  it("should take a database that a release before migrations recorded a kind migrated", async () => {
    postgres = await startPostgres();
    await compose({ config: testConfig(postgres.settings) }).run();
    // Such a release made the table without the kind column
    dataSource = await openPostgres(postgres.settings);
    await dataSource.query("ALTER TABLE migrations DROP COLUMN kind");

    server = await serverOver(postgres.settings);
    await server.stop();
    server = undefined;
    await compose({ config: testConfig(postgres.settings) }).run();

    expect(await migrationRows(postgres.settings)).toEqual([
      { name: "2022-03-23-initial", kind: null },
      { name: "2026-11-14-blank-texts", kind: null },
    ]);
  }, 120_000);

  it("should throw once the database has not answered for the startup wait", async () => {
    unreachable = unreachableDbConfig();
    const { config } = unreachable;

    await expect(compose({ config, clock: steppingClock() }).run()).rejects.toThrow(
      /^DB did not answer for 60000ms: /,
    );
  });
});

import { DataSource } from "typeorm";
import { afterEach, describe, expect, it } from "vitest";

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

  /** Returns the names of the migrations the database has run, without their extensions. */
  const migrationNames = async (settings: TestPostgres["settings"]) => {
    dataSource ??= await openPostgres(settings);
    const rows = await dataSource.query<{ name: string }[]>("SELECT name FROM migrations");

    return rows.map(({ name }) => name.replace(/\.(ts|js)$/, "")).toSorted();
  };

  afterEach(async () => {
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

  it("should apply each migration once, even when two steps run at the same time", async () => {
    postgres = await startPostgres();
    const step = compose({ config: testConfig(postgres.settings) });

    await Promise.all([step.run(), step.run()]);
    await step.run();

    expect(await migrationNames(postgres.settings)).toEqual([
      "2022-03-23-initial",
      "2026-11-14-blank-texts",
    ]);
  }, 120_000);

  it("should refuse, as the server does, a database that newer code migrated", async () => {
    postgres = await startPostgres();
    await compose({ config: testConfig(postgres.settings) }).run();
    dataSource = await openPostgres(postgres.settings);
    await dataSource.query(
      "INSERT INTO migrations (name) VALUES ('2099-01-01-from-newer-code.js')",
    );

    const newerCode =
      /^The database holds the migrations 2099-01-01-from-newer-code, which this code does not know: newer code migrated it$/;

    await expect(compose({ config: testConfig(postgres.settings) }).run()).rejects.toThrow(
      newerCode,
    );
    await expect(serverOver(postgres.settings)).rejects.toThrow(newerCode);
  }, 120_000);

  it("should throw once the database has not answered for the startup wait", async () => {
    unreachable = unreachableDbConfig();
    const { config } = unreachable;

    await expect(compose({ config, clock: steppingClock() }).run()).rejects.toThrow(
      /^DB did not answer for 60000ms: /,
    );
  });
});

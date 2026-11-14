import { afterEach, describe, expect, it } from "vitest";

import { startMigratedPostgres, TestPostgres } from "../../../tests/utils/postgres.js";
import { steppingClock } from "../../../tests/utils/steppingClock.js";
import { testConfig } from "../../../tests/utils/testConfig.js";
import { unreachableDbConfig } from "../../../tests/utils/unreachableDbConfig.js";
import { systemClock } from "../../infra/systemClock.js";
import { compose, ServerHandle } from "./compose.js";

describe("the server's database lifecycle", () => {
  let postgres: TestPostgres | undefined;
  let server: ServerHandle | undefined;
  let unreachable: ReturnType<typeof unreachableDbConfig> | undefined;

  afterEach(async () => {
    await server?.stop();
    await postgres?.stop();
    unreachable?.remove();
    server = undefined;
    postgres = undefined;
    unreachable = undefined;
  });

  it("should throw once the database has not answered for the startup wait", async () => {
    unreachable = unreachableDbConfig();
    const { config } = unreachable;

    await expect(compose({ config, clock: steppingClock(), logger: false })).rejects.toThrow(
      /^DB did not answer for 60000ms: /,
    );
  });

  it("should report the database lost once it has been gone for the limit", async () => {
    postgres = await startMigratedPostgres();
    let isDbStopped = false;
    let reportLost: (error: unknown) => void = () => {};
    const lost = new Promise<{ error: unknown; isDbStopped: boolean }>((resolve) => {
      reportLost = (error) => resolve({ error, isDbStopped });
    });
    server = await compose({
      config: testConfig(postgres.settings),
      clock: steppingClock(),
      onDbLost: reportLost,
      logger: false,
    });
    await server.start();

    isDbStopped = true;
    await postgres.stop();
    postgres = undefined;

    const loss = await lost;

    // The loss comes only once the database is gone
    expect(loss.isDbStopped).toBe(true);
    expect(loss.error).toBeInstanceOf(Error);
  }, 120_000);

  it("should not report the database lost after the server has stopped", async () => {
    postgres = await startMigratedPostgres();
    let lostCount = 0;
    server = await compose({
      config: testConfig(postgres.settings),
      clock: steppingClock(),
      onDbLost: () => {
        lostCount += 1;
      },
      logger: false,
    });
    await server.start();

    await server.stop();
    server = undefined;
    await postgres.stop();
    postgres = undefined;
    // The real wait spans more than the 30s loss limit on the stepping clock, about 1.5 real
    // seconds, so a watch left running would have reported the loss
    await systemClock.sleep(2_500);

    expect(lostCount).toBe(0);
  }, 120_000);
});

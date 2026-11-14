import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { startPostgres, TestPostgres } from "../../../tests/utils/postgres.js";
import { steppingClock } from "../../../tests/utils/steppingClock.js";
import { testConfig } from "../../../tests/utils/testConfig.js";
import { systemClock } from "../../infra/systemClock.js";
import { compose, ServerHandle } from "./compose.js";

describe("the server's database lifecycle", () => {
  let postgres: TestPostgres | undefined;
  let server: ServerHandle | undefined;
  let tempDir: string | undefined;

  afterEach(async () => {
    await server?.stop();
    await postgres?.stop();
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    server = undefined;
    postgres = undefined;
    tempDir = undefined;
  });

  it("should throw once the database has not answered for the startup wait", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "compose-"));
    const passwordFile = join(tempDir, "password");
    writeFileSync(passwordFile, "password");
    // Nothing listens on port 1, so every ping is refused
    const config = testConfig({
      host: "127.0.0.1",
      port: 1,
      username: "guessir",
      passwordFile,
      database: "guessir",
    });

    await expect(compose({ config, clock: steppingClock(), logger: false })).rejects.toThrow(
      /^DB did not answer for 60000ms: /,
    );
  });

  it("should report the database lost once it has been gone for the limit", async () => {
    postgres = await startPostgres();
    let reportLost: (error: unknown) => void = () => {};
    const lost = new Promise<unknown>((resolve) => {
      reportLost = resolve;
    });
    server = await compose({
      config: testConfig(postgres.settings),
      clock: steppingClock(),
      onDbLost: reportLost,
      logger: false,
    });
    await server.start();

    await postgres.stop();
    postgres = undefined;

    await expect(lost).resolves.toBeInstanceOf(Error);
  }, 120_000);

  it("should not report the database lost after the server has stopped", async () => {
    postgres = await startPostgres();
    let lostCount = 0;
    const stopped = await compose({
      config: testConfig(postgres.settings),
      clock: steppingClock(),
      onDbLost: () => {
        lostCount += 1;
      },
      logger: false,
    });
    await stopped.start();

    await stopped.stop();
    await postgres.stop();
    postgres = undefined;
    // Many watch intervals of the stepping clock pass in this real wait
    await systemClock.sleep(500);

    expect(lostCount).toBe(0);
  }, 120_000);
});

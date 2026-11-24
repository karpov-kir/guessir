import { Logger, LogLevel } from "@guessir/logger";
import { collectLogs } from "@guessir/logger/testing";
import { describe, expect, it } from "vitest";

import { LogFormat } from "#src/infra/logger/exports.js";
import {
  compose as composeMigrate,
  type MigrateOverrides,
} from "#src/entrypoints/migrate/compose.js";
import { compose as composeServer, type ServerOverrides } from "./compose.js";

describe("a config that fails to parse", () => {
  it.each([
    ["the server", (overrides: ServerOverrides) => composeServer(overrides)],
    ["the migrate step", async (overrides: MigrateOverrides) => composeMigrate(overrides)],
  ])("should be logged by %s in the format LOG_FORMAT asks for", async (_, compose) => {
    const pretty = collectLogs();
    const json = collectLogs();

    // The environment lacks `DATABASE_HOST`, so the config fails to parse
    await expect(
      compose({
        env: { LOG_FORMAT: "json" },
        logSinks: { [LogFormat.Pretty]: pretty.sink, [LogFormat.Json]: json.sink },
      }),
    ).rejects.toThrow("DATABASE_HOST");
    // The test logs in place of `startServer` and `runMigrations`, which log the error `compose`
    // throws and then exit the process
    Logger.root.scope("Test").error("Failed to start");

    expect(json.lines(LogLevel.Error)).toHaveLength(1);
    expect(pretty.lines()).toEqual([]);
  });
});

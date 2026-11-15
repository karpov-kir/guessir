import { Logger as TypeOrmLogger } from "typeorm";
import { beforeEach, describe, expect, it } from "vitest";

import { collectLogs } from "../../../tests/utils/collectLogs.js";
import { Logger, LogLevel } from "../../shared/Logger.js";
import { ParameterFreeLogger } from "./ParameterFreeLogger.js";

const secretText = "the whole hidden text of a game";
const insertQuery = "INSERT INTO texts VALUES ($1)";
// The tests type the logger as TypeORM's `Logger`, so they can pass query parameters as TypeORM
// does. `ParameterFreeLogger` declares `logQuery`, `logQueryError` and `logQuerySlow` without the
// parameters.
let parameterFreeLogger: TypeOrmLogger;
let logs: ReturnType<typeof collectLogs>;

describe(ParameterFreeLogger, () => {
  beforeEach(() => {
    logs = collectLogs();
    Logger.install(logs.sink, LogLevel.Debug);
    parameterFreeLogger = new ParameterFreeLogger();
  });

  it("should log a failed query with its error but without its parameters", () => {
    parameterFreeLogger.logQueryError(new Error("connection lost"), insertQuery, [secretText]);

    expect(logs.lines()).toEqual([
      {
        kind: "line",
        level: LogLevel.Error,
        scope: ["typeorm"],
        args: ["Query failed: Error: connection lost; INSERT INTO texts VALUES ($1)"],
      },
    ]);
  });

  it("should not log successful or slow queries, whose parameters carry the texts", () => {
    parameterFreeLogger.logQuery(insertQuery, [secretText]);
    parameterFreeLogger.logQuerySlow(5_000, insertQuery, [secretText]);

    expect(logs.lines()).toEqual([]);
  });

  it("should log only the warnings among the messages TypeORM reports on its own", () => {
    parameterFreeLogger.log("warn", "deprecated option");
    parameterFreeLogger.log("info", "connected");
    parameterFreeLogger.log("log", "connected");

    expect(logs.lines().map(({ level, args }) => ({ level, args }))).toEqual([
      { level: LogLevel.Warn, args: ["deprecated option"] },
    ]);
  });

  it("should inspect a warning that is not a string", () => {
    parameterFreeLogger.log("warn", { reason: "pool error" });

    expect(logs.lines(LogLevel.Warn)[0]?.args).toEqual(["{ reason: 'pool error' }"]);
  });

  it("should log schema builds and migrations", () => {
    parameterFreeLogger.logSchemaBuild("schema built");
    parameterFreeLogger.logMigration("migration applied");

    expect(logs.lines(LogLevel.Info).map(({ args }) => args)).toEqual([
      ["schema built"],
      ["migration applied"],
    ]);
  });
});

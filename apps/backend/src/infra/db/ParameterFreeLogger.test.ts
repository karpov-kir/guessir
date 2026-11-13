import { Logger } from "@nestjs/common";
import { Logger as TypeOrmLogger } from "typeorm";
import { beforeEach, describe, expect, it, MockInstance, vi } from "vitest";

import { ParameterFreeLogger } from "./ParameterFreeLogger.js";

const secretText = "the whole hidden text of a game";
const insertQuery = "INSERT INTO texts VALUES ($1)";
const levels = ["error", "warn", "log", "debug", "verbose", "fatal"] as const;
// The tests type the logger as TypeORM's `Logger`, so they can pass query parameters as TypeORM
// does. `ParameterFreeLogger` declares `logQuery`, `logQueryError` and `logQuerySlow` without the
// parameters.
let parameterFreeLogger: TypeOrmLogger;
let logSpies: Record<(typeof levels)[number], MockInstance>;

describe(ParameterFreeLogger, () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    const spyOnLevel = (level: (typeof levels)[number]) =>
      vi.spyOn(Logger.prototype, level).mockImplementation(() => undefined);

    logSpies = {
      error: spyOnLevel("error"),
      warn: spyOnLevel("warn"),
      log: spyOnLevel("log"),
      debug: spyOnLevel("debug"),
      verbose: spyOnLevel("verbose"),
      fatal: spyOnLevel("fatal"),
    };
    parameterFreeLogger = new ParameterFreeLogger();
  });

  it("should log a failed query with its error but without its parameters", () => {
    parameterFreeLogger.logQueryError(new Error("connection lost"), insertQuery, [secretText]);

    expect(logSpies.error).toHaveBeenCalledTimes(1);
    expect(logSpies.error).toHaveBeenCalledWith(
      "Query failed: Error: connection lost; INSERT INTO texts VALUES ($1)",
    );
  });

  it("should not log successful or slow queries, whose parameters carry the texts", () => {
    parameterFreeLogger.logQuery(insertQuery, [secretText]);
    parameterFreeLogger.logQuerySlow(5_000, insertQuery, [secretText]);

    for (const level of levels) {
      expect(logSpies[level]).not.toHaveBeenCalled();
    }
  });

  it("should log only the warnings among the messages TypeORM reports on its own", () => {
    parameterFreeLogger.log("warn", "deprecated option");
    parameterFreeLogger.log("info", "connected");
    parameterFreeLogger.log("log", "connected");

    expect(logSpies.warn).toHaveBeenCalledTimes(1);
    expect(logSpies.warn).toHaveBeenCalledWith("deprecated option");
    for (const level of levels.filter((level) => level !== "warn")) {
      expect(logSpies[level]).not.toHaveBeenCalled();
    }
  });

  it("should inspect a warning that is not a string", () => {
    parameterFreeLogger.log("warn", { reason: "pool error" });

    expect(logSpies.warn).toHaveBeenCalledWith("{ reason: 'pool error' }");
  });

  it("should log schema builds and migrations", () => {
    parameterFreeLogger.logSchemaBuild("schema built");
    parameterFreeLogger.logMigration("migration applied");

    expect(logSpies.log).toHaveBeenCalledWith("schema built");
    expect(logSpies.log).toHaveBeenCalledWith("migration applied");
  });
});

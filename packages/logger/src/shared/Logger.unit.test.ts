import { describe, expect, it } from "vitest";

import { collectLogs } from "#src/testing/exports.js";
import { Logger, LogLevel } from "./Logger.js";

const logger = Logger.root.scope("Test");

describe("Logger", () => {
  it("should hand the sink each line at or above the level, under nested scopes", () => {
    const logs = collectLogs();
    Logger.install(logs.sink, LogLevel.Info);

    logger.scope("Inner").debug("d");
    logger.scope("Inner").info("i");
    logger.warn("w");
    logger.error("e", 1);

    expect(logs.lines()).toEqual([
      { kind: "line", level: LogLevel.Info, scope: ["Test", "Inner"], args: ["i"] },
      { kind: "line", level: LogLevel.Warn, scope: ["Test"], args: ["w"] },
      { kind: "line", level: LogLevel.Error, scope: ["Test"], args: ["e", 1] },
    ]);
  });

  it("should end only the groups the sink saw open", () => {
    const records: unknown[] = [];
    Logger.install((record) => records.push(record), LogLevel.Info);

    logger.group("g");
    logger.groupCollapsed("c");
    logger.groupEnd();
    logger.groupEnd();
    logger.groupEnd();

    expect(records).toEqual([
      { kind: "group", collapsed: false, scope: ["Test"], label: "g" },
      { kind: "group", collapsed: true, scope: ["Test"], label: "c" },
      { kind: "groupEnd" },
      { kind: "groupEnd" },
    ]);
  });

  it("should hand the sink nothing at Silent", () => {
    const records: unknown[] = [];
    Logger.install((record) => records.push(record), LogLevel.Silent);

    logger.error("e");
    logger.group("g");
    logger.groupEnd();

    expect(records).toEqual([]);
  });
});

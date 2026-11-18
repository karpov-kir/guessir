import { beforeEach, describe, expect, it } from "vitest";

import { collectLogs } from "@guessir/logger/testing";
import { Logger, LogLevel } from "@guessir/logger";
import { nestLogger } from "./nestLogger.js";

let logs: ReturnType<typeof collectLogs>;

describe("nestLogger", () => {
  beforeEach(() => {
    logs = collectLogs();
    Logger.install(logs.sink, LogLevel.Debug);
  });

  it("should scope each line by Nest's context and map Nest's levels", () => {
    nestLogger.log("Mapped {/health, GET} route", "RouterExplorer");
    nestLogger.warn("deprecated", "NestFactory");
    nestLogger.debug?.("detail", "Injector");
    nestLogger.verbose?.("more detail", "Injector");
    nestLogger.fatal?.("crashed", "NestApplication");

    expect(logs.lines().map(({ level, scope, args }) => ({ level, scope, args }))).toEqual([
      { level: LogLevel.Info, scope: ["RouterExplorer"], args: ["Mapped {/health, GET} route"] },
      { level: LogLevel.Warn, scope: ["NestFactory"], args: ["deprecated"] },
      { level: LogLevel.Debug, scope: ["Injector"], args: ["detail"] },
      { level: LogLevel.Debug, scope: ["Injector"], args: ["more detail"] },
      { level: LogLevel.Error, scope: ["NestApplication"], args: ["crashed"] },
    ]);
  });

  it("should keep an error's stack and drop the undefined Nest passes without one", () => {
    const error = new Error("boom");

    nestLogger.error(error, undefined, "ExceptionsHandler");
    nestLogger.error("failed", "the stack", "ExceptionsHandler");
    nestLogger.log("no context");

    expect(logs.lines().map(({ scope, args }) => ({ scope, args }))).toEqual([
      { scope: ["ExceptionsHandler"], args: [error] },
      { scope: ["ExceptionsHandler"], args: ["failed", "the stack"] },
      { scope: [], args: ["no context"] },
    ]);
  });
});

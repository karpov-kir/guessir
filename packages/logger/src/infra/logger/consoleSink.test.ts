import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LogLevel } from "../../shared/Logger.js";
import { newConsoleSink } from "./consoleSink.js";

const clock = { now: () => Date.parse("2026-11-15T12:00:00.000Z") };
const methods = ["log", "warn", "error", "group", "groupCollapsed", "groupEnd"] as const;
const calls = (method: (typeof methods)[number]) => vi.mocked(console[method]).mock.calls;

describe(newConsoleSink, () => {
  beforeEach(() => {
    for (const method of methods) {
      vi.spyOn(console, method).mockImplementation(() => undefined);
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should open each line with the time, the level and the scope, on the console of its level", () => {
    const sink = newConsoleSink({ clock });

    sink({ kind: "line", level: LogLevel.Debug, scope: ["db"], args: ["query"] });
    sink({ kind: "line", level: LogLevel.Info, scope: ["server"], args: ["started"] });
    sink({ kind: "line", level: LogLevel.Warn, scope: ["dbWatch"], args: ["slow"] });
    sink({ kind: "line", level: LogLevel.Error, scope: [], args: [{ code: 1 }] });

    expect(calls("log")).toEqual([
      ["[12:00:00.000] [DEBUG] [db]", "query"],
      ["[12:00:00.000] [INFO] [server]", "started"],
    ]);
    expect(calls("warn")).toEqual([["[12:00:00.000] [WARN] [dbWatch]", "slow"]]);
    expect(calls("error")).toEqual([["[12:00:00.000] [ERROR]", '{\n  "code": 1\n}']]);
  });

  it("should write an error and an object holding one as JSON, and leave other values as they are", () => {
    const sink = newConsoleSink({ clock, name: "GS" });
    const error = new Error("boom");
    const circular: { self?: unknown } = {};
    circular.self = circular;
    const shown = { name: "Error", message: "boom", stack: error.stack };

    sink({
      kind: "line",
      level: LogLevel.Info,
      scope: [],
      args: ["text", 7, null, undefined, error, { error }, circular],
    });

    expect(calls("log")).toEqual([
      [
        "[GS 12:00:00.000] [INFO]",
        "text",
        7,
        null,
        undefined,
        JSON.stringify(shown),
        JSON.stringify({ error: shown }, null, 2),
        circular,
      ],
    ]);
  });

  it("should hand the console an error whose stack throws, and not throw itself", () => {
    const sink = newConsoleSink({ clock });
    const error = new Error("boom");

    Object.defineProperty(error, "stack", {
      get() {
        throw new Error("stack unavailable");
      },
    });

    sink({ kind: "line", level: LogLevel.Error, scope: [], args: [error] });

    expect(calls("error")).toEqual([["[12:00:00.000] [ERROR]", error]]);
  });

  it("should open groups on the console with their scope, and end them", () => {
    const sink = newConsoleSink({ clock });

    sink({ kind: "group", collapsed: false, scope: ["migrate"], label: "Migrations" });
    sink({ kind: "group", collapsed: true, scope: [], label: "Details" });
    sink({ kind: "groupEnd" });

    expect([calls("group"), calls("groupCollapsed"), calls("groupEnd")]).toEqual([
      [["[migrate] Migrations"]],
      [["Details"]],
      [[]],
    ]);
  });
});

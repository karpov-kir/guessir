import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Logger, LogLevel } from "./Logger";

const log = Logger.root.scope("Test");

/** Returns each console call of the given method, with the time stamp cut from its header. */
const calls = (
  method: "log" | "warn" | "error" | "group" | "groupCollapsed" | "groupEnd",
): unknown[][] =>
  vi
    .mocked(console[method])
    .mock.calls.map((args) =>
      args.map((arg, index) =>
        index === 0 && typeof arg === "string" ? arg.replace(/^\[GS [\d:.]+\]/, "[GS]") : arg,
      ),
    );

beforeEach(() => {
  for (const method of ["log", "warn", "error", "group", "groupCollapsed", "groupEnd"] as const) {
    vi.spyOn(console, method).mockImplementation(() => undefined);
  }
});
afterEach(() => {
  log.setLevel(LogLevel.Warn);
});

describe("Logger", () => {
  it("writes warn and error by default and drops info and debug", () => {
    log.debug("d");
    log.info("i");
    log.warn("w");
    log.error("e");
    expect([calls("log"), calls("warn"), calls("error")]).toEqual([
      [],
      [["[GS] [WARN] [Test]", "w"]],
      [["[GS] [ERROR] [Test]", "e"]],
    ]);
  });

  it("writes every level from debug once the level is lowered, under nested scopes", () => {
    const inner = log.scope("Inner");
    inner.setLevel(LogLevel.Debug);
    inner.debug("d");
    inner.info("i");
    inner.group("g");
    inner.groupCollapsed("c");
    inner.groupEnd();
    expect([calls("log"), calls("group"), calls("groupCollapsed"), calls("groupEnd")]).toEqual([
      [
        ["[GS] [DEBUG] [Test] [Inner]", "d"],
        ["[GS] [INFO] [Test] [Inner]", "i"],
      ],
      [["g"]],
      [["c"]],
      [[]],
    ]);
  });

  it("writes nothing at Silent", () => {
    log.setLevel(LogLevel.Silent);
    log.error("e");
    log.group("g");
    expect([calls("error"), calls("group")]).toEqual([[], []]);
  });

  it("writes an error and an object holding one as JSON, and leaves other values as they are", () => {
    const error = new Error("boom");
    const circular: { self?: unknown } = {};
    circular.self = circular;
    log.warn("text", 7, null, undefined, error, { error }, circular);
    const shown = { name: "Error", message: "boom", stack: error.stack };
    expect(calls("warn")).toEqual([
      [
        "[GS] [WARN] [Test]",
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
});

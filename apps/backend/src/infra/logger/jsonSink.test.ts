import { describe, expect, it } from "vitest";

import { LogLevel } from "@guessir/logger";
import { newJsonSink } from "./jsonSink.js";

const clock = { now: () => Date.parse("2026-11-15T12:00:00.000Z") };

const newSink = () => {
  const written: string[] = [];
  const sink = newJsonSink({ clock, destination: { write: (line) => written.push(line) } });

  return { sink, lines: () => written.map((line): unknown => JSON.parse(line)) };
};

describe(newJsonSink, () => {
  it("should write each line as JSON with its time, level, scope and message", () => {
    const { sink, lines } = newSink();

    sink({ kind: "line", level: LogLevel.Info, scope: ["server", "db"], args: ["port", 5432] });
    sink({ kind: "line", level: LogLevel.Debug, scope: [], args: [{ a: 1 }] });

    expect(lines()).toEqual([
      { time: "2026-11-15T12:00:00.000Z", level: "info", scope: "server db", msg: "port 5432" },
      { time: "2026-11-15T12:00:00.000Z", level: "debug", scope: "", msg: "{ a: 1 }" },
    ]);
  });

  it("should put an error under err with its stack", () => {
    const { sink, lines } = newSink();

    sink({
      kind: "line",
      level: LogLevel.Error,
      scope: ["server"],
      args: ["Failed to start:", new Error("boom")],
    });

    expect(lines()).toMatchObject([
      { level: "error", msg: "Failed to start:", err: { type: "Error", message: "boom" } },
    ]);
    expect(JSON.stringify(lines())).toContain("at ");
  });

  it("should leave an error's other fields out, since they can carry a stored text", () => {
    const { sink, lines } = newSink();

    sink({
      kind: "line",
      level: LogLevel.Error,
      scope: [],
      args: [Object.assign(new Error("boom"), { parameters: ["the hidden text"] })],
    });

    expect(JSON.stringify(lines())).not.toContain("the hidden text");
  });

  it("should write a group's label as an info line and skip its end", () => {
    const { sink, lines } = newSink();

    sink({ kind: "group", collapsed: false, scope: ["migrate"], label: "Migrations" });
    sink({ kind: "groupEnd" });

    expect(lines()).toEqual([
      expect.objectContaining({ level: "info", scope: "migrate", msg: "Migrations" }),
    ]);
  });
});

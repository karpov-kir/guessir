// Vendored from karpov-kir/configs, ai/kk-flavor/standards/architecture/consoleSink.ts at b4d234a9.
// Changed here: the sink declares its own `Clock`, whose `now` returns milliseconds, because a
// package imports no app.

import { LogLevel, type LogRecord, type LogSink } from "../../shared/Logger.js";

/** Tells the time the sink stamps each line with, in milliseconds since the Unix epoch. */
type Clock = { now(): number };

interface ConsoleSinkOptions {
  /** Stamps each line with the time. */
  clock: Clock;
  /** Opens every line, such as the app's short name. */
  name?: string;
  /** Turns objects and errors into JSON, so a console that shows only text still shows their fields. */
  stringifyObjects?: boolean;
}

const isErrorLike = (
  object: unknown,
): object is { name: unknown; message: unknown; stack?: unknown } => {
  return (
    typeof object === "object" &&
    object !== null &&
    "name" in object &&
    "message" in object &&
    typeof object.name === "string" &&
    typeof object.message === "string"
  );
};

/** Returns an object or error as JSON text, or the argument itself when it is a primitive or JSON cannot hold it. */
const stringifyArg = (arg: unknown): unknown => {
  if (typeof arg !== "object" || arg === null) {
    return arg;
  }
  try {
    if (isErrorLike(arg)) {
      return JSON.stringify({ name: arg.name, message: arg.message, stack: arg.stack });
    }
    return JSON.stringify(
      arg,
      (_key, value: unknown) =>
        isErrorLike(value)
          ? { name: value.name, message: value.message, stack: value.stack }
          : value,
      2,
    );
  } catch {
    // The catch hands the object itself to the console, which shows its structure. JSON throws on a cycle or a BigInt,
    // a getter such as an error's `stack` may throw, and `String` would print only "[object Object]".
    return arg;
  }
};

const levelNames: Record<Exclude<LogLevel, LogLevel.Silent>, string> = {
  [LogLevel.Debug]: "DEBUG",
  [LogLevel.Info]: "INFO",
  [LogLevel.Warn]: "WARN",
  [LogLevel.Error]: "ERROR",
};

/**
 * Returns the sink that writes records to the console, each line opened by the name, if any, the time and the level, then its
 * scope labels. The project vendors it into `infra/logger`, inside `infra`, the one layer that calls the console:
 *
 *   Logger.install(newConsoleSink({ clock: systemClock, name: 'CS' }), config.logLevel);
 *   // Logger.root.scope('Editor').info('ready') → [CS 12:00:00.000] [INFO] [Editor] ready
 */
export function newConsoleSink({
  clock,
  name,
  stringifyObjects = true,
}: ConsoleSinkOptions): LogSink {
  return (record: LogRecord) => {
    if (record.kind === "groupEnd") {
      console.groupEnd();
      return;
    }
    const labels = record.scope.map((label) => ` [${label}]`).join("");
    if (record.kind === "group") {
      (record.collapsed ? console.groupCollapsed : console.group)(
        `${labels.trimStart()} ${record.label}`.trim(),
      );
      return;
    }
    const time = new Date(clock.now()).toISOString().split("T")[1]?.replace("Z", "");
    const args = stringifyObjects ? record.args.map(stringifyArg) : record.args;
    const stamp = name === undefined ? time : `${name} ${time}`;
    const line = [`[${stamp}] [${levelNames[record.level]}]${labels}`, ...args];
    if (record.level >= LogLevel.Error) {
      console.error(...line);
    } else if (record.level >= LogLevel.Warn) {
      console.warn(...line);
    } else {
      console.log(...line);
    }
  };
}

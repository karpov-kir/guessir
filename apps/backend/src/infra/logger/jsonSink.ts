import { inspect } from "node:util";

import { type DestinationStream, destination as fileDestination, pino } from "pino";

import type { Clock } from "#/shared/Clock.js";
import { LogLevel, type LogRecord, type LogSink } from "@guessir/logger";

type JsonSinkOptions = {
  clock: Pick<Clock, "now">;
  /** Takes the lines. By default they go to standard output at once, so none is lost on an exit. */
  destination?: DestinationStream;
};

const methods = {
  [LogLevel.Debug]: "debug",
  [LogLevel.Info]: "info",
  [LogLevel.Warn]: "warn",
  [LogLevel.Error]: "error",
} as const;

const text = (arg: unknown) =>
  typeof arg === "string" ? arg : inspect(arg, { breakLength: Infinity });

/**
 * Returns the sink that writes each record as one JSON line through pino, with its time, level,
 * scope and message. The first error among a line's arguments goes under `err`. A group writes its
 * label as an info line, since JSON lines have no groups.
 */
export function newJsonSink({ clock, destination }: JsonSinkOptions): LogSink {
  const logger = pino(
    {
      level: "debug",
      base: undefined,
      timestamp: () => `,"time":"${new Date(clock.now()).toISOString()}"`,
      formatters: { level: (label) => ({ level: label }) },
      // The serializer writes only an error's type, message and stack, as the console sink of
      // `@guessir/logger` does. Another field of the error, such as a query's parameters, can carry
      // a stored text, and that text must stay out of the log.
      serializers: {
        err: (error: Error) => ({ type: error.name, message: error.message, stack: error.stack }),
      },
    },
    destination ?? fileDestination({ dest: 1, sync: true }),
  );

  return (record: LogRecord) => {
    if (record.kind === "groupEnd") {
      return;
    }

    const scope = record.scope.join(" ");

    if (record.kind === "group") {
      logger.info({ scope }, record.label);
      return;
    }

    const err = record.args.find((arg) => arg instanceof Error);
    const message = record.args
      .filter((arg) => arg !== err)
      .map(text)
      .join(" ");

    logger[methods[record.level]](err === undefined ? { scope } : { scope, err }, message);
  };
}

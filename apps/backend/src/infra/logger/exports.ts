import type { Clock } from "#/shared/Clock.js";
import type { LogSink } from "@guessir/logger";
import { newConsoleSink } from "@guessir/logger/infra";

import { newJsonSink } from "./jsonSink.js";

/** Names the shape of the log lines: `pretty` for a person, `json` for a log collector. */
export enum LogFormat {
  Pretty = "pretty",
  Json = "json",
}

export const newLogSink = (format: LogFormat, { clock }: { clock: Pick<Clock, "now"> }): LogSink =>
  format === LogFormat.Json ? newJsonSink({ clock }) : newConsoleSink({ clock });

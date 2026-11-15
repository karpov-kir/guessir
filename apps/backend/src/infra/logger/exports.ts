import type { Clock } from "../../shared/Clock.js";
import type { LogSink } from "../../shared/Logger.js";
import { newConsoleSink } from "./consoleSink.js";
import { newJsonSink } from "./jsonSink.js";

export { newConsoleSink } from "./consoleSink.js";

/** Names the shape of the log lines: `pretty` for a person, `json` for a log collector. */
export enum LogFormat {
  Pretty = "pretty",
  Json = "json",
}

export const newLogSink = (format: LogFormat, { clock }: { clock: Pick<Clock, "now"> }): LogSink =>
  format === LogFormat.Json ? newJsonSink({ clock }) : newConsoleSink({ clock });

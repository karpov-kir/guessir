import { type LogLevel, type LogRecord, type LogSink } from "./shared/Logger.js";

type LogLine = Extract<LogRecord, { kind: "line" }>;

/** Returns a sink that keeps the records it takes, and the lines among them, for a test to read. */
export function collectLogs(): { sink: LogSink; lines(level?: LogLevel): LogLine[] } {
  const records: LogRecord[] = [];

  return {
    sink: (record) => records.push(record),
    lines: (level) =>
      records.filter(
        (record): record is LogLine =>
          record.kind === "line" && (level === undefined || record.level === level),
      ),
  };
}

/** Takes the records and drops them, for a test that reads no log. */
export const silentSink: LogSink = () => undefined;

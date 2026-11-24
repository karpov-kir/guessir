import { type LogSink } from "#src/shared/Logger.js";

/** Takes the records and drops them, for a test that reads no log. */
export const silentSink: LogSink = () => undefined;

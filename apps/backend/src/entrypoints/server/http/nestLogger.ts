import type { LoggerService } from "@nestjs/common";

import { Logger } from "../../../shared/Logger.js";

/**
 * Returns the app's logger scoped by Nest's context, and the other arguments. Nest passes the
 * context, when it has one, as the last argument. For an error without a stack, Nest passes
 * undefined in the stack's place, and the function drops it.
 */
const withContext = (params: unknown[]) => {
  const context = params.at(-1);
  const scoped = typeof context === "string" ? Logger.root.scope(context) : Logger.root;
  const rest = typeof context === "string" ? params.slice(0, -1) : params;

  return { scoped, rest: rest.filter((param) => param !== undefined) };
};

const logAt =
  (level: "debug" | "info" | "warn" | "error") =>
  (message: unknown, ...params: unknown[]) => {
    const { scoped, rest } = withContext(params);
    scoped[level](message, ...rest);
  };

/**
 * Hands Nest's log lines to the app's logger, scoped by their context, such as `RoutesResolver`.
 */
export const nestLogger: LoggerService = {
  log: logAt("info"),
  error: logAt("error"),
  warn: logAt("warn"),
  debug: logAt("debug"),
  verbose: logAt("debug"),
  fatal: logAt("error"),
};

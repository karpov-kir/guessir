import { inspect } from "node:util";

/**
 * Returns an error the way it reads in a log line. A thrown value that is not an Error is
 * inspected, so it never reads "[object Object]".
 */
export function errorText(error: unknown): string {
  return error instanceof Error ? String(error) : inspect(error);
}

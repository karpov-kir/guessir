import { setTimeout as sleep } from "node:timers/promises";
import { inspect } from "node:util";

import { Logger } from "@nestjs/common";

const logger = new Logger("dbWatch");

interface WatchOptions {
  limitMs: number;
  intervalMs: number;
}

/**
 * Pings every `intervalMs`, one ping at a time, and resolves with the last ping error or a timeout
 * error once no ping has answered for `limitMs`. It never rejects. A ping on a dropped connection
 * can hang for minutes, so a ping that has not returned counts as no answer.
 */
export async function watchDb(
  ping: () => Promise<unknown>,
  { limitMs, intervalMs }: WatchOptions,
): Promise<unknown> {
  let lastAnswerAt = Date.now();
  let lastError: unknown;
  let pending: Promise<void> | undefined;

  for (;;) {
    // The function sends the ping before the wait. A stalled event loop then cannot end the watch
    // before any ping has gone out.
    pending ??= ping()
      .then(
        () => {
          lastAnswerAt = Date.now();
          lastError = undefined;
        },
        (error: unknown) => {
          if (lastError === undefined) {
            logger.warn(`DB is not reachable: ${errorText(error)}`);
          }

          lastError = error;
        },
      )
      .finally(() => {
        pending = undefined;
      });

    await sleep(intervalMs);

    if (Date.now() - lastAnswerAt >= limitMs) {
      return lastError ?? new Error(`Database ping has not returned for ${limitMs}ms`);
    }
  }
}

/**
 * Pings every `intervalMs` until the database answers. Throws the last ping error once `limitMs`
 * has passed, or a timeout error when a ping hangs past it, so a dropped connection cannot hold the
 * start forever.
 */
export async function waitForDb(
  ping: () => Promise<unknown>,
  { limitMs, intervalMs }: WatchOptions,
): Promise<void> {
  const deadline = Date.now() + limitMs;
  const timeout = new Error(`Database ping has not returned for ${limitMs}ms`);

  for (;;) {
    try {
      await Promise.race([
        ping(),
        sleep(Math.max(deadline - Date.now(), 0), undefined, { ref: false }).then(() => {
          throw timeout;
        }),
      ]);
      return;
    } catch (error) {
      // The check treats the timeout error as the deadline. Its timer can fire a moment before
      // `Date.now()` reaches the deadline.
      if (error === timeout || Date.now() >= deadline) {
        throw error;
      }

      logger.warn(`DB is not reachable yet: ${String(error)}`);
    }

    await sleep(intervalMs);
  }
}

/**
 * Returns an error the way it reads in a log line. A thrown value that is not an Error is
 * inspected, so it never reads "[object Object]".
 */
export function errorText(error: unknown): string {
  return error instanceof Error ? String(error) : inspect(error);
}

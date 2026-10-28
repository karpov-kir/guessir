import { setTimeout as sleep } from 'node:timers/promises';

import { Logger } from '@nestjs/common';

const logger = new Logger('dbWatch');

interface WatchOptions {
  limitMs: number;
  intervalMs: number;
}

/**
 * Pings the database every interval, one ping at a time, and resolves once no ping has answered for the limit.
 * Resolves with the last ping error, or with a timeout error when the pings hung without failing. It never rejects.
 * A ping on a connection the network dropped can hang for minutes, so a ping that has not returned counts as no answer.
 */
export async function watchDb(ping: () => Promise<unknown>, { limitMs, intervalMs }: WatchOptions): Promise<unknown> {
  let lastAnswerAt = Date.now();
  let lastError: unknown;
  let pending: Promise<void> | undefined;

  for (;;) {
    await sleep(intervalMs);

    if (Date.now() - lastAnswerAt >= limitMs) {
      return lastError ?? new Error(`Database ping has not returned for ${limitMs}ms`);
    }

    pending ??= ping()
      .then(
        () => {
          lastAnswerAt = Date.now();
          lastError = undefined;
        },
        (error: unknown) => {
          if (lastError === undefined) {
            logger.warn(`DB is not reachable: ${String(error)}`);
          }

          lastError = error;
        },
      )
      .finally(() => {
        pending = undefined;
      });
  }
}

/**
 * Pings the database every interval until it answers. Throws the last ping error once the limit has passed. A ping
 * that hangs past the limit throws too, so a dropped connection cannot hold the start forever.
 */
export async function waitForDb(ping: () => Promise<unknown>, { limitMs, intervalMs }: WatchOptions): Promise<void> {
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
      if (Date.now() >= deadline) {
        throw error;
      }

      logger.warn(`DB is not reachable yet: ${String(error)}`);
    }

    await sleep(intervalMs);
  }
}

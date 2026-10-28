import { setTimeout as sleep } from 'node:timers/promises';

import { Logger } from '@nestjs/common';

const logger = new Logger('dbWatch');

interface WatchOptions {
  limitMs: number;
  intervalMs: number;
}

/**
 * Pings the database every interval, one ping at a time, and resolves with the last error once no ping has answered
 * for the limit. A ping on a connection the network dropped can hang for minutes, so a ping that has not returned
 * counts as no answer.
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

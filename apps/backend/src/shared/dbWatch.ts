import { Logger } from "@nestjs/common";

import type { Clock } from "./Clock.js";
import { errorText } from "./errorText.js";

const logger = new Logger("dbWatch");

/**
 * How long the server's start and the migrate step wait for the database. A deploy of a Postgres
 * patch release restarts the database, and a task that exits at once pauses the Swarm rolling
 * update.
 */
const startupWaitMs = 60_000;

/** How often a wait or a watch pings the database. */
export const pingEveryMs = 1_000;

export type WaitOptions = {
  /** Asks the database whether it answers. */
  ping: () => Promise<unknown>;
  clock: Clock;
  limitMs: number;
  intervalMs: number;
};

export type WatchOptions = WaitOptions & {
  /** Ends the watch once aborted. */
  signal: AbortSignal;
};

/**
 * Pings every `intervalMs`, one ping at a time, and resolves with the last ping error or a timeout
 * error once no ping has answered for `limitMs`. It resolves with undefined once `signal` aborts,
 * and never rejects. A ping on a dropped connection can hang for minutes, so a ping that has not
 * returned counts as no answer.
 */
export async function watchDb({
  ping,
  clock,
  limitMs,
  intervalMs,
  signal,
}: WatchOptions): Promise<unknown> {
  let lastAnswerAt = clock.now();
  let lastError: unknown;
  let pending: Promise<void> | undefined;

  for (;;) {
    // The function sends the ping before the wait. A stalled event loop then cannot end the watch
    // before any ping has gone out.
    pending ??= ping()
      .then(
        () => {
          lastAnswerAt = clock.now();
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

    await clock.sleep(intervalMs);

    if (signal.aborted) {
      return undefined;
    }

    if (clock.now() - lastAnswerAt >= limitMs) {
      return lastError ?? new Error(`Database ping has not returned for ${limitMs}ms`);
    }
  }
}

/**
 * Pings every `intervalMs` until the database answers. Throws the last ping error once `limitMs`
 * has passed, or a timeout error when a ping hangs past it, so a dropped connection cannot hold the
 * start forever.
 */
export async function waitForDb({ ping, clock, limitMs, intervalMs }: WaitOptions): Promise<void> {
  const deadline = clock.now() + limitMs;
  const timeout = new Error(`Database ping has not returned for ${limitMs}ms`);

  for (;;) {
    try {
      await Promise.race([
        ping(),
        clock.sleep(Math.max(deadline - clock.now(), 0), { holdsProcess: false }).then(() => {
          throw timeout;
        }),
      ]);
      return;
    } catch (error) {
      // The check treats the timeout error as the deadline. Its timer can fire a moment before the
      // clock reaches the deadline.
      if (error === timeout || clock.now() >= deadline) {
        throw error;
      }

      logger.warn(`DB is not reachable yet: ${String(error)}`);
    }

    await clock.sleep(intervalMs);
  }
}

/**
 * Waits for the database as a start does, pinging every second for up to a minute. Throws with the
 * wait and the last ping error once the database has not answered for that long.
 */
export async function waitForDbAtStart({
  ping,
  clock,
}: Pick<WaitOptions, "ping" | "clock">): Promise<void> {
  await waitForDb({ ping, clock, limitMs: startupWaitMs, intervalMs: pingEveryMs }).catch(
    (error: unknown) => {
      throw new Error(`DB did not answer for ${startupWaitMs}ms: ${errorText(error)}`);
    },
  );
}

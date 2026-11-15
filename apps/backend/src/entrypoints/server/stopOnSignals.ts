import { Logger } from "@nestjs/common";

import { errorText } from "../../shared/errorText.js";

const logger = new Logger("server");

/** The part of `process` that stopping on a signal needs, so a test can stand in for it. */
export type SignalledProcess = {
  once(signal: NodeJS.Signals, listener: () => void): unknown;
  exit(code: number): void;
};

/**
 * Stops the server on SIGTERM or SIGINT, then exits 0, or 1 if stopping fails.
 * The server runs as PID 1 in its container, where the kernel ignores the
 * default action of these signals, so without this `docker stop` waits until
 * Docker kills it. A later signal does not stop the server again.
 */
export function stopOnSignals({
  stop,
  process: signalled = process,
}: {
  stop: () => Promise<void>;
  process?: SignalledProcess;
}) {
  let isStopping = false;
  const onSignal = (signal: NodeJS.Signals) => {
    if (isStopping) {
      return;
    }

    isStopping = true;
    logger.log(`${signal} received, stopping`);
    stop().then(
      () => signalled.exit(0),
      (error: unknown) => {
        logger.error(`Failed to stop: ${errorText(error)}`);
        signalled.exit(1);
      },
    );
  };

  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    signalled.once(signal, () => onSignal(signal));
  }
}

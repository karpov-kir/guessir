import { EventEmitter } from "node:events";

import { describe, expect, it, vi } from "vitest";

import { SignalledProcess, stopOnSignals } from "./stopOnSignals.js";

/** Returns a process that a test signals, which records the codes it exits with. */
const newProcess = () => {
  const events = new EventEmitter();
  const exitCodes: number[] = [];
  const signalled: SignalledProcess = {
    once: (signal, listener) => events.once(signal, listener),
    exit: (code) => {
      exitCodes.push(code);
    },
  };

  return { events, exitCodes, signalled };
};

/** Returns a server that counts its stops and whose stop returns the promise from `stopping`. */
const newServer = (stopping: () => Promise<void> = () => Promise.resolve()) => {
  let stopCount = 0;

  return {
    stop: () => {
      stopCount += 1;

      return stopping();
    },
    get stopCount() {
      return stopCount;
    },
  };
};

describe(stopOnSignals, () => {
  it.each(["SIGTERM", "SIGINT"] as const)(
    "should stop the server on %s and exit with 0",
    async (signal) => {
      const { events, exitCodes, signalled } = newProcess();
      const server = newServer();

      stopOnSignals({ stop: server.stop, process: signalled });
      events.emit(signal);

      await vi.waitFor(() => expect(exitCodes).toEqual([0]));
      expect(server.stopCount).toBe(1);
    },
  );

  it("should exit with 1 when the server fails to stop", async () => {
    const { events, exitCodes, signalled } = newProcess();
    const server = newServer(() => Promise.reject(new Error("Test")));

    stopOnSignals({ stop: server.stop, process: signalled });
    events.emit("SIGTERM");

    await vi.waitFor(() => expect(exitCodes).toEqual([1]));
  });

  it("should stop the server once when a second signal arrives while it stops", async () => {
    const { events, exitCodes, signalled } = newProcess();
    const stopped = Promise.withResolvers<void>();
    const server = newServer(() => stopped.promise);

    stopOnSignals({ stop: server.stop, process: signalled });
    events.emit("SIGTERM");
    events.emit("SIGINT");
    stopped.resolve();

    await vi.waitFor(() => expect(exitCodes).toEqual([0]));
    expect(server.stopCount).toBe(1);
  });
});

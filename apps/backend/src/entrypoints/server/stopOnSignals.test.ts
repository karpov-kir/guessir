import { EventEmitter } from "node:events";

import { Logger } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { SignalledProcess, stopOnSignals } from "./stopOnSignals.js";

Logger.overrideLogger(false);

const newProcess = () => {
  const events = new EventEmitter();
  const exit = vi.fn<(code: number) => void>();
  const signalled: SignalledProcess = {
    once: (signal, listener) => events.once(signal, listener),
    exit,
  };

  return { events, exit, signalled };
};

describe(stopOnSignals, () => {
  it.each(["SIGTERM", "SIGINT"] as const)(
    "should stop the server on %s and exit with 0",
    async (signal) => {
      const { events, exit, signalled } = newProcess();
      const stop = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

      stopOnSignals({ stop, process: signalled });
      events.emit(signal);

      await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0));
      expect(stop).toHaveBeenCalledTimes(1);
    },
  );

  it("should exit with 1 when the server fails to stop", async () => {
    const { events, exit, signalled } = newProcess();
    const stop = vi.fn<() => Promise<void>>().mockRejectedValue(new Error("Test"));

    stopOnSignals({ stop, process: signalled });
    events.emit("SIGTERM");

    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(1));
  });

  it("should stop the server once when a second signal arrives while it stops", async () => {
    const { events, exit, signalled } = newProcess();
    const stopped = Promise.withResolvers<void>();
    const stop = vi.fn<() => Promise<void>>().mockReturnValue(stopped.promise);

    stopOnSignals({ stop, process: signalled });
    events.emit("SIGTERM");
    events.emit("SIGINT");
    stopped.resolve();

    await vi.waitFor(() => expect(exit).toHaveBeenCalledWith(0));
    expect(stop).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledTimes(1);
  });
});

import { describe, expect, it, vi } from "vitest";
import { mock } from "vitest-mock-extended";

import { collectLogs, silentSink } from "@guessir/logger/testing";
import { GameApi } from "../../features/gameLoading/exports";
import { Logger, LogLevel } from "@guessir/logger";
import { compose } from "./compositionRoot";

describe(compose, () => {
  it("should wire the theme toggle and render the game page", async () => {
    const body = document.createElement("div");
    const themeButton = document.createElement("button");

    await compose({
      api: mock<GameApi>(),
      location: { origin: "https://guessir.test", search: "" },
      clipboard: { writeText: vi.fn<(text: string) => Promise<void>>() },
      storage: () => mock<Storage>(),
      systemTheme: { matches: true, addEventListener: vi.fn<() => void>() },
      logSink: silentSink,
    }).mount({ body, themeButton });

    expect(themeButton.getAttribute("aria-pressed")).toBe("true");
    expect(body.querySelector("main#guessir #game")).not.toBeNull();
  });

  it("should log through the sink it was given, from the info level up", () => {
    const logs = collectLogs();

    compose({ logSink: logs.sink });
    Logger.root.scope("Test").debug("dropped");
    Logger.root.scope("Test").info("kept");

    expect(logs.lines()).toEqual([
      { kind: "line", level: LogLevel.Info, scope: ["Test"], args: ["kept"] },
    ]);
  });
});

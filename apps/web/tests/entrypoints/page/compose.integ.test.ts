import { newRecordingCollector } from "@kk-forge/artel-collector/testing";
import { afterEach, describe, expect, it, vi } from "vitest";

import { collectLogs, silentSink } from "@guessir/logger/testing";
import { FakeApi } from "../../utils/fakeApi";
import { fakeSystemTheme } from "../../utils/fakeSystemTheme";
import { FakeClipboard } from "../../utils/fakeClipboard";
import { AnalyticsEvents } from "../../../src/entities/analytics/exports";
import { track } from "../../../src/shared/analytics";
import { Logger, LogLevel } from "@guessir/logger";
import { compose } from "../../../src/entrypoints/page/compose";

const config = {
  apiBaseUrl: "https://api.guessir.test",
  analytics: {
    key: "site-test-aaaaaaaaaa",
    endpoint: "https://intake.guessir.test/v1/public/relay",
    version: "1.0.0",
  },
};

describe(compose, () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should wire the theme toggle, render the game page, count the page view and bind the analytics track", async () => {
    const body = document.createElement("div");
    const themeButton = document.createElement("button");
    const analytics = newRecordingCollector();
    const storedValues = new Map<string, string>();

    await compose({
      api: new FakeApi(),
      location: { origin: "https://guessir.test", search: "" },
      clipboard: new FakeClipboard(),
      storage: () => ({
        getItem: (key) => storedValues.get(key) ?? null,
        setItem: (key, value) => void storedValues.set(key, value),
      }),
      systemTheme: fakeSystemTheme(true),
      logSink: silentSink,
      analytics,
      config,
    }).mount({ body, themeButton });

    expect(themeButton.getAttribute("aria-pressed")).toBe("true");
    expect(body.querySelector("main#guessir #game")).not.toBeNull();
    await expect.poll(() => analytics.events).toEqual([{ name: "page_view" }]);
    track(AnalyticsEvents.TextCreated);
    expect(analytics.events).toEqual([{ name: "page_view" }, { name: "text_created" }]);
  });

  it("should log through the sink it was given, from the info level up", () => {
    const logs = collectLogs();

    compose({ logSink: logs.sink, config });
    Logger.root.scope("Test").debug("dropped");
    Logger.root.scope("Test").info("kept");

    expect(logs.lines()).toEqual([
      { kind: "line", level: LogLevel.Info, scope: ["Test"], args: ["kept"] },
    ]);
  });

  it("should install the sink before it reads the environment, so an invalid one gets logged", () => {
    const logs = collectLogs();

    vi.stubEnv("GUESSIR_API_BASE_URL", "");

    expect(() => compose({ logSink: logs.sink })).toThrow("GUESSIR_API_BASE_URL");
    Logger.root.scope("Test").error("after the failure");

    expect(logs.lines()).toEqual([
      { kind: "line", level: LogLevel.Error, scope: ["Test"], args: ["after the failure"] },
    ]);
  });
});

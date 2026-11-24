import type { Collector } from "@kk-forge/artel-collector";
import { trackPageViews } from "@kk-forge/artel-collector/infra";

import {
  newThemeUseCases,
  type SystemThemeQuery,
  type ThemeStorage,
} from "#/features/theme/exports.js";
import { browserStorage, pageLocation, systemClipboard, systemDarkTheme } from "#/infra/browser.js";
import { newAnalytics } from "#/infra/analytics.js";
import { readEnv } from "#/infra/env.js";
import { FetchHttpClient } from "#/infra/fetchHttp.js";
import { systemClock } from "#/infra/systemClock.js";
import type { Clock } from "#/shared/Clock.js";
import { bindTrack } from "#/shared/analytics.js";
import { Logger, LogLevel, type LogSink } from "@guessir/logger";
import { newConsoleSink } from "@guessir/logger/infra";
import { type GamePageDependencies, mountGamePage } from "#/orchestration/gamePage/exports.js";
import { type PageConfig, parseConfig } from "./config";

export type PageOverrides = Partial<
  Omit<GamePageDependencies, "clock"> & {
    clock: Clock;
    /** Stands in for the analytics collector that sends to the intake. */
    analytics: Collector<"anonymous">;
    /** Stands in for the config the build's environment holds. */
    config: PageConfig;
    storage: () => ThemeStorage;
    systemTheme: SystemThemeQuery;
    /** Takes the log records in place of the console, so a test can read or drop them. */
    logSink: LogSink;
  }
>;

/**
 * Builds the page over the browser and API or the stand-ins in `overrides`, and installs the global
 * log sink at once. Throws when the build's environment is invalid. Renders nothing until `mount`.
 */
export function compose(overrides: PageOverrides = {}) {
  const clock = overrides.clock ?? systemClock;

  Logger.install(overrides.logSink ?? newConsoleSink({ clock, name: "GS" }), LogLevel.Info);
  const config = overrides.config ?? parseConfig(readEnv());

  return {
    /**
     * Binds the analytics `track`, counts the page view, wires the theme toggle and renders the game
     * page into `body`.
     */
    async mount({ body, themeButton }: { body: HTMLElement; themeButton: HTMLButtonElement }) {
      const analytics = overrides.analytics ?? newAnalytics(config.analytics);

      bindTrack((event, params) => void analytics.track(event, params));
      trackPageViews(analytics);
      newThemeUseCases({
        button: themeButton,
        root: document.documentElement,
        getStorage: overrides.storage ?? browserStorage,
        systemTheme: overrides.systemTheme ?? systemDarkTheme(),
      }).attach();
      await mountGamePage(body, {
        api: overrides.api ?? new FetchHttpClient({ baseUrl: config.apiBaseUrl }),
        location: overrides.location ?? pageLocation(),
        clipboard: overrides.clipboard ?? systemClipboard(),
        clock,
      });
    },
  };
}

import { initThemeToggle, type SystemThemeQuery } from "../../features/theme/exports";
import {
  browserStorage,
  pageLocation,
  systemClipboard,
  systemDarkTheme,
} from "../../infra/browser";
import { readEnv } from "../../infra/env";
import { FetchHttpClient } from "../../infra/fetchHttp";
import { systemClock } from "../../infra/systemClock";
import type { Clock } from "../../shared/Clock";
import { Logger, LogLevel, type LogSink, newConsoleSink } from "@guessir/logger";
import { type GamePageDependencies, mountGamePage } from "../../orchestration/gamePage/exports";
import { type PageConfig, parseConfig } from "./config";

export type PageOverrides = Partial<
  Omit<GamePageDependencies, "clock"> & {
    clock: Clock;
    /** Stands in for the config the build's environment holds. */
    config: PageConfig;
    storage: () => Storage;
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
    /** Wires the theme toggle and renders the game page into `body`. */
    async mount({ body, themeButton }: { body: HTMLElement; themeButton: HTMLButtonElement }) {
      initThemeToggle({
        button: themeButton,
        root: document.documentElement,
        getStorage: overrides.storage ?? browserStorage,
        systemTheme: overrides.systemTheme ?? systemDarkTheme(),
      });
      await mountGamePage(body, {
        api: overrides.api ?? new FetchHttpClient({ baseUrl: config.apiBaseUrl }),
        location: overrides.location ?? pageLocation(),
        clipboard: overrides.clipboard ?? systemClipboard(),
        clock,
      });
    },
  };
}

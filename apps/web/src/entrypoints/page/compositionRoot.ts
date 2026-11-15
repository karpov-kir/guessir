import { initThemeToggle, type SystemThemeQuery } from "../../features/theme/exports";
import { FetchHttpClient } from "../../infra/fetchHttp";
import { systemClock } from "../../infra/systemClock";
import { config } from "../../shared/config";
import { Logger, LogLevel, type LogSink, newConsoleSink } from "@guessir/logger";
import { type GamePageDependencies, mountGamePage } from "../../orchestration/gamePage/exports";

export type PageOverrides = Partial<
  GamePageDependencies & {
    storage: () => Storage;
    systemTheme: SystemThemeQuery;
    /** Takes the log records in place of the console, so a test can read or drop them. */
    logSink: LogSink;
  }
>;

/**
 * Builds the page over the real browser and API, or over what `overrides` stands in, and installs
 * the global log sink at once. Returns the page's handle without rendering anything.
 */
export function compose(overrides: PageOverrides = {}) {
  Logger.install(
    overrides.logSink ?? newConsoleSink({ clock: systemClock, name: "GS" }),
    LogLevel.Info,
  );

  return {
    /** Wires the theme toggle and renders the game page into `body`. */
    async mount({ body, themeButton }: { body: HTMLElement; themeButton: HTMLButtonElement }) {
      initThemeToggle({
        button: themeButton,
        root: document.documentElement,
        getStorage: overrides.storage ?? (() => globalThis.localStorage),
        systemTheme: overrides.systemTheme ?? globalThis.matchMedia("(prefers-color-scheme: dark)"),
      });
      await mountGamePage(body, {
        api: overrides.api ?? new FetchHttpClient(config.apiBaseUrl),
        location: overrides.location ?? globalThis.location,
        clipboard: overrides.clipboard ?? globalThis.navigator.clipboard,
      });
    },
  };
}

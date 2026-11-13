import { initThemeToggle, type SystemThemeQuery } from "../../features/theme/exports";
import { FetchHttpClient } from "../../infra/fetchHttp";
import { config } from "../../shared/config";
import { type GamePageDependencies, mountGamePage } from "../../orchestration/gamePage/exports";

export type PageOverrides = Partial<
  GamePageDependencies & { storage: () => Storage; systemTheme: SystemThemeQuery }
>;

/**
 * Builds the page over the real browser and API, or over what `overrides` stands in. Returns the
 * page's handle without rendering anything.
 */
export function compose(overrides: PageOverrides = {}) {
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

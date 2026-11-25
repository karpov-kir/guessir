import moonIcon from "./moonIcon.svg?raw";
import sunIcon from "./sunIcon.svg?raw";
import { icon } from "#src/shared/icon.js";
import type { SystemThemeQuery, ThemeStorage } from "./port";

const Theme = {
  Light: "light",
  Dark: "dark",
} as const;
type Theme = (typeof Theme)[keyof typeof Theme];

export type ThemeUseCasesOptions = {
  button: HTMLButtonElement;
  root: HTMLElement;
  getStorage: () => ThemeStorage;
  systemTheme: SystemThemeQuery;
};

const storageKey = "guessir.theme";

/**
 * Returns the stored theme, or undefined when none is stored or storage fails. Storage can throw in
 * a private window or with blocked site data, even on reading `globalThis.localStorage`, so the
 * toggle keeps working without it.
 */
function readStoredTheme(getStorage: () => ThemeStorage): Theme | undefined {
  try {
    const value = getStorage().getItem(storageKey);

    return value === Theme.Light || value === Theme.Dark ? value : undefined;
  } catch {
    return undefined;
  }
}

function storeTheme(getStorage: () => ThemeStorage, theme: Theme) {
  try {
    getStorage().setItem(storageKey, theme);
  } catch {
    // The choice then lasts until the page is reloaded
  }
}

/** Keeps the page's theme: the user's pick when stored, the system theme otherwise. */
export class ThemeUseCases {
  private readonly deps: ThemeUseCasesOptions;

  constructor({ ...deps }: ThemeUseCasesOptions) {
    this.deps = deps;
  }

  /**
   * Wires the dark theme toggle. Without a stored choice, CSS makes the page follow the system
   * theme, so the toggle sets `data-theme` on the root only once the user picks a theme.
   */
  attach() {
    const { button, root, getStorage, systemTheme } = this.deps;

    // The button holds both icons: `src/entrypoints/page/styles/header.css` shows the moon in the
    // light theme and the sun in the dark one.
    button.replaceChildren(icon(moonIcon, "icon-moon"), icon(sunIcon, "icon-sun"));

    const storedTheme = readStoredTheme(getStorage);

    if (storedTheme) {
      root.dataset.theme = storedTheme;
    }

    const isDark = () =>
      root.dataset.theme ? root.dataset.theme === Theme.Dark : systemTheme.matches;
    const renderPressed = () => button.setAttribute("aria-pressed", String(isDark()));

    renderPressed();
    systemTheme.addEventListener("change", renderPressed);

    button.addEventListener("click", () => {
      const theme = isDark() ? Theme.Light : Theme.Dark;

      root.dataset.theme = theme;
      renderPressed();
      storeTheme(getStorage, theme);
    });
  }
}

/**
 * Returns the theme use cases over `options`. The caller calls `attach` to wire the toggle.
 */
export function newThemeUseCases(options: ThemeUseCasesOptions): ThemeUseCases {
  return new ThemeUseCases(options);
}

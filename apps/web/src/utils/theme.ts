import moonIcon from "../icons/moonIcon.svg?raw";
import sunIcon from "../icons/sunIcon.svg?raw";
import { icon } from "./icon";

enum Theme {
  Light = "light",
  Dark = "dark",
}

/**
 * Describes the part of `MediaQueryList` the toggle reads, so a test can stand in for the system
 * theme.
 */
export type SystemThemeQuery = {
  matches: boolean;
  addEventListener(type: "change", listener: () => void): void;
};

type ThemeToggleOptions = {
  button: HTMLButtonElement;
  root: HTMLElement;
  getStorage: () => Storage;
  systemTheme: SystemThemeQuery;
};

const storageKey = "guessir.theme";

/**
 * Returns the stored theme, or undefined when none is stored or storage fails. Storage can throw in
 * a private window or with blocked site data, even on reading `globalThis.localStorage`, so the
 * toggle keeps working without it.
 */
function readStoredTheme(getStorage: () => Storage): Theme | undefined {
  try {
    const value = getStorage().getItem(storageKey);

    return value === Theme.Light || value === Theme.Dark ? value : undefined;
  } catch {
    return undefined;
  }
}

function storeTheme(getStorage: () => Storage, theme: Theme) {
  try {
    getStorage().setItem(storageKey, theme);
  } catch {
    // The choice then lasts until the page is reloaded
  }
}

/**
 * Wires the dark theme toggle. Without a stored choice, CSS makes the page follow the system theme,
 * so the toggle sets `data-theme` on the root only once the user picks a theme.
 */
export function initThemeToggle({ button, root, getStorage, systemTheme }: ThemeToggleOptions) {
  // The button holds both icons: `src/styles/header.css` shows the moon in the light theme and the
  // sun in the dark one.
  button.innerHTML = icon(moonIcon, "icon-moon") + icon(sunIcon, "icon-sun");

  const storedTheme = readStoredTheme(getStorage);

  if (storedTheme) {
    root.dataset.theme = storedTheme;
  }

  const isDark = () =>
    root.dataset.theme ? root.dataset.theme === String(Theme.Dark) : systemTheme.matches;
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

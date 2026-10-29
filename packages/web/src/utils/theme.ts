enum Theme {
  Light = 'light',
  Dark = 'dark',
}

/** The part of `MediaQueryList` the toggle uses, so a test can stand in for the system theme */
export type SystemThemeQuery = {
  matches: boolean;
  addEventListener(type: 'change', listener: () => void): void;
};

type ThemeToggleOptions = {
  button: HTMLButtonElement;
  root?: HTMLElement;
  getStorage?: () => Storage;
  systemTheme?: SystemThemeQuery;
};

const storageKey = 'guessir.theme';

/**
 * Returns the stored theme, or undefined when none is stored or the storage is unavailable.
 * Storage can throw in a private window or with blocked site data, even on reaching `window.localStorage`,
 * so the toggle keeps working without it.
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
 * Wires the dark theme toggle. Without a stored choice the page follows the system theme through CSS,
 * so `data-theme` on the root is set only once the user picks a theme.
 */
export function initThemeToggle({
  button,
  root = document.documentElement,
  getStorage = () => window.localStorage,
  systemTheme = window.matchMedia('(prefers-color-scheme: dark)'),
}: ThemeToggleOptions) {
  const storedTheme = readStoredTheme(getStorage);

  if (storedTheme) {
    root.dataset.theme = storedTheme;
  }

  const isDark = () => (root.dataset.theme ? root.dataset.theme === Theme.Dark : systemTheme.matches);
  const renderPressed = () => button.setAttribute('aria-pressed', String(isDark()));

  renderPressed();
  systemTheme.addEventListener('change', renderPressed);

  button.addEventListener('click', () => {
    const theme = isDark() ? Theme.Light : Theme.Dark;

    root.dataset.theme = theme;
    renderPressed();
    storeTheme(getStorage, theme);
  });
}

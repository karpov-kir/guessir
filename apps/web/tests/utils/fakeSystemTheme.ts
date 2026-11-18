import type { SystemThemeQuery } from "../../src/features/theme/exports";

/** Means the system's theme, which a test switches with `change`. */
export type FakeSystemTheme = SystemThemeQuery & { change(matches: boolean): void };

/** Returns the system's theme, dark when `matches`, which tells its listeners when it changes. */
export function fakeSystemTheme(matches: boolean): FakeSystemTheme {
  const listeners: Array<() => void> = [];
  const systemTheme: FakeSystemTheme = {
    matches,
    addEventListener: (_type, listener) => void listeners.push(listener),
    change: (nextMatches) => {
      systemTheme.matches = nextMatches;
      listeners.forEach((listener) => listener());
    },
  };

  return systemTheme;
}

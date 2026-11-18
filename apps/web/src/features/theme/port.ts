/**
 * Describes the part of `MediaQueryList` the toggle reads, so a test can stand in for the system
 * theme.
 */
export type SystemThemeQuery = {
  matches: boolean;
  addEventListener(type: "change", listener: () => void): void;
};

/** Keeps the user's theme between visits. */
export type ThemeStorage = Pick<Storage, "getItem" | "setItem">;

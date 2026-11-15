// Wraps the browser's own objects. Only the composition root reads them, so a test can pass a
// stand-in for each.

/** Returns the page's local storage. Reading it throws where the browser blocks site data. */
export const browserStorage = (): Storage => globalThis.localStorage;

/** Returns the page's URL. */
export const pageLocation = (): Location => globalThis.location;

/**
 * Returns the system clipboard. The browser gives no clipboard to a page outside a secure context.
 */
export const systemClipboard = (): Clipboard => globalThis.navigator.clipboard;

/** Returns the query that tells whether the system prefers a dark theme. */
export const systemDarkTheme = (): MediaQueryList =>
  globalThis.matchMedia("(prefers-color-scheme: dark)");

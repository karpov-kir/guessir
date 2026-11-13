// Coverage skips the page's entry: it wires the real browser objects. `boot` and `initThemeToggle` have
// their own tests.
/* v8 ignore start */

import { boot } from "./boot";
import { requireElement } from "./utils/dom";
import { FetchHttpClient } from "./utils/HttpClient";
import { initThemeToggle } from "./utils/theme";

initThemeToggle({
  button: requireElement({ root: document, selector: "#theme-toggle", type: HTMLButtonElement }),
  root: document.documentElement,
  getStorage: () => globalThis.localStorage,
  systemTheme: globalThis.matchMedia("(prefers-color-scheme: dark)"),
});
void boot(document.body, {
  httpClient: new FetchHttpClient(import.meta.env.GUESSIR_API_BASE_URL),
  location: globalThis.location,
  clipboard: globalThis.navigator.clipboard,
});

/* v8 ignore stop */

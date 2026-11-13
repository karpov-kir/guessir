/* v8 ignore start */

import { boot } from "./boot";
import { requireElement } from "./utils/dom";
import { initThemeToggle } from "./utils/theme";

initThemeToggle({
  button: requireElement({ root: document, selector: "#theme-toggle", type: HTMLButtonElement }),
});
void boot(document.body);

/* v8 ignore stop */

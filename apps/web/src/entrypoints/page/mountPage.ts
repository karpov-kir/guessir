// Coverage skips the page's entry: it hands the real document to compose(),
// whose tests cover the rest
/* v8 ignore start */

import "./styles/page.css";
import { compose } from "./compositionRoot";
// The page imports the utilities after the modules that `./compositionRoot` pulls in. So a utility
// class wins a tie of equal specificity against the styles of every module.
import "./styles/utilities.css";
import { requireElement } from "../../shared/dom";

/** Renders the page into the document that index.html loads. */
export function mountPage() {
  void compose().mount({
    body: document.body,
    themeButton: requireElement({
      root: document,
      selector: "#theme-toggle",
      type: HTMLButtonElement,
    }),
  });
}

/* v8 ignore stop */

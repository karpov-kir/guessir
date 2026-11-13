// Coverage skips the launcher: it hands the real page to compose(), whose tests cover the rest
/* v8 ignore start */

import "./styles/index.css";
import { requireElement } from "../../shared/dom";
import { compose } from "./compositionRoot";

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

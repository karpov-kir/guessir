// Coverage skips this entry. The entry hands the real document to `compose`, and the tests of
// `compose` cover the rest.
/* v8 ignore start */

import { Logger } from "@guessir/logger";

import "./styles/page.css";
import { compose } from "./compose";
// The page imports the utilities after the modules that `./compose` pulls in. So a utility
// class wins a tie of equal specificity against the styles of every module.
import "./styles/utilities.css";
import { requireElement } from "#/shared/dom.js";

const logger = Logger.root.scope("page");

/**
 * Renders the page into the document that index.html loads. Logs the failure when the build's
 * environment is invalid or the page fails to render.
 */
export async function mountPage() {
  try {
    await compose().mount({
      body: document.body,
      themeButton: requireElement({
        root: document,
        selector: "#theme-toggle",
        type: HTMLButtonElement,
      }),
    });
  } catch (error) {
    logger.error("Failed to render the page", error);
  }
}

/* v8 ignore stop */

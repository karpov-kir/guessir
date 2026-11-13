import { CreateTextApi } from "./createTextApi";
import { CreateTextRenderer } from "./CreateTextRenderer";

/** Returns the form that stores a new text and gives its link, ready to place in the page. */
export function mountCreateText(options: {
  api: CreateTextApi;
  /** The page origin the link to a created text starts with. */
  origin: string;
  clipboard: Pick<Clipboard, "writeText">;
}): HTMLElement {
  return new CreateTextRenderer({
    httpClient: options.api,
    origin: options.origin,
    clipboard: options.clipboard,
  }).getElement();
}

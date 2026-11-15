import { CreateTextRenderer, type CreateTextRendererOptions } from "./CreateTextRenderer";

/** Returns the form that stores a new text and gives its link, ready to place in the page. */
export function mountCreateText(
  options: Pick<CreateTextRendererOptions, "api" | "origin" | "clipboard" | "clock">,
): HTMLElement {
  return new CreateTextRenderer(options).getElement();
}

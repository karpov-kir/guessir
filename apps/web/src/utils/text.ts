/** Returns the link that opens the stored text with `id` on the page at `origin`. */
export function textUrl(origin: string, id: string) {
  return `${origin}?textId=${id}`;
}

/** Returns the text id in the query string `search`, or undefined when it names no text. */
export function parseTextId(search: string): string | undefined {
  return new URLSearchParams(search).get("textId") || undefined;
}

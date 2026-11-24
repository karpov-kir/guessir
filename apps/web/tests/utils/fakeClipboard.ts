import type { ClipboardWriter } from "#/features/createText/exports.js";

/** Holds in memory the text last written, as the system clipboard does. */
export class FakeClipboard implements ClipboardWriter {
  public text = "";

  async writeText(text: string): Promise<void> {
    this.text = text;
  }
}

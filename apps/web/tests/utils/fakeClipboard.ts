import type { ClipboardWriter } from "../../src/features/createText/exports";

/** Holds in memory the text last written, as the system clipboard does. */
export class FakeClipboard implements ClipboardWriter {
  public text = "";

  async writeText(text: string): Promise<void> {
    this.text = text;
  }
}

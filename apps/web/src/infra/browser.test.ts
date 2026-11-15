import { afterEach, describe, expect, it, vi } from "vitest";

import { browserStorage, pageLocation, systemClipboard, systemDarkTheme } from "./browser";

describe("browser", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should hand out the page's storage and location", () => {
    expect(browserStorage()).toBe(globalThis.localStorage);
    expect(pageLocation()).toBe(globalThis.location);
  });

  it("should hand out the clipboard and ask the system for its dark theme", () => {
    const clipboard = { writeText: vi.fn<(text: string) => Promise<void>>() };
    const query = { matches: true };
    const matchMedia = vi.fn<(query: string) => unknown>(() => query);

    vi.stubGlobal("navigator", { clipboard });
    vi.stubGlobal("matchMedia", matchMedia);

    expect(systemClipboard()).toBe(clipboard);
    expect(systemDarkTheme()).toBe(query);
    expect(matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
  });
});

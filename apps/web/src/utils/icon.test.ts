import { describe, expect, it } from "vitest";

import { icon } from "./icon";

describe(icon, () => {
  it("should mark an icon as decorative and give it the shared class", () => {
    expect(icon('<svg viewBox="0 0 24 24"></svg>')).toBe(
      '<svg class="icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"></svg>',
    );
  });

  it("should add an icon-specific class after the shared one", () => {
    expect(icon("<svg></svg>", "icon-sun")).toBe(
      '<svg class="icon icon-sun" aria-hidden="true" focusable="false"></svg>',
    );
  });
});

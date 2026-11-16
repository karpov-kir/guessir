import { describe, expect, it } from "vitest";

import { icon } from "./icon";

describe(icon, () => {
  it("should mark an icon as decorative and give it the shared class", () => {
    const element = icon('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"></svg>');

    expect(element.getAttribute("class")).toBe("icon");
    expect(element.getAttribute("aria-hidden")).toBe("true");
    expect(element.getAttribute("focusable")).toBe("false");
    expect(element.getAttribute("viewBox")).toBe("0 0 24 24");
  });

  it("should add an icon-specific class after the shared one", () => {
    expect(
      icon('<svg xmlns="http://www.w3.org/2000/svg"></svg>', "icon-sun").getAttribute("class"),
    ).toBe("icon icon-sun");
  });

  it("should refuse a file that holds no <svg> element", () => {
    expect(() => icon("<div></div>")).toThrow(TypeError);
  });
});

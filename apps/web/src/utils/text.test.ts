import { describe, expect, it } from "vitest";

import { parseTextId, textUrl } from "./text";

describe(textUrl, () => {
  it("should link the page to the text", () => {
    expect(textUrl("https://guessir.test", "a1")).toBe("https://guessir.test?textId=a1");
  });
});

describe(parseTextId, () => {
  it.each([
    { search: "?textId=1", expected: "1" },
    { search: "?textId=", expected: undefined },
    { search: "", expected: undefined },
  ])("should return $expected for $search", ({ search, expected }) => {
    expect(parseTextId(search)).toBe(expected);
  });
});

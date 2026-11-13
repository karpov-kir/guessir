import { describe, expect, it } from "vitest";

import { textSkeletonSchema } from "./types.js";

const skeleton = {
  title: "Title",
  allowShowingFirstLetters: true,
  allowShowingText: false,
  wordCount: 1,
  lexemes: [
    { index: 0, length: 3 },
    { index: 1, character: "." },
  ],
};

describe("textSkeletonSchema", () => {
  it("should read a skeleton", () => {
    expect(textSkeletonSchema.parse({ ...skeleton, description: "About" })).toEqual({
      ...skeleton,
      description: "About",
    });
  });

  it.each([null, undefined])("should read the description %s as no description", (description) => {
    expect(textSkeletonSchema.parse({ ...skeleton, description }).description).toBeUndefined();
  });

  it("should drop any letters a word lexeme carries", () => {
    const parsed = textSkeletonSchema.parse({
      ...skeleton,
      lexemes: [{ index: 0, length: 3, word: "One" }],
    });

    expect(parsed.lexemes).toEqual([{ index: 0, length: 3 }]);
  });

  it.each([
    { field: "wordCount", value: -1 },
    { field: "lexemes", value: [{ index: 0 }] },
    { field: "allowShowingText", value: "yes" },
  ])("should reject a skeleton whose $field is $value", ({ field, value }) => {
    expect(textSkeletonSchema.safeParse({ ...skeleton, [field]: value }).success).toBe(false);
  });
});

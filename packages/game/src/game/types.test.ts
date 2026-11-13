import { describe, expect, it } from "vitest";

import { guessDtoSchema, revealDtoSchema, textSkeletonSchema } from "./types.js";

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

describe("guessDtoSchema", () => {
  it("should read a word", () => {
    expect(guessDtoSchema.parse({ word: "one" })).toEqual({ word: "one" });
  });

  it.each([{}, { word: 3 }, { word: "" }, { word: "a".repeat(101) }, { word: "one", index: 0 }])(
    "should reject the body %o",
    (body) => {
      expect(guessDtoSchema.safeParse(body).success).toBe(false);
    },
  );
});

describe("revealDtoSchema", () => {
  it("should read an index", () => {
    expect(revealDtoSchema.parse({ index: 0 })).toEqual({ index: 0 });
  });

  it.each([{}, { index: "1" }, { index: 1.5 }, { index: -1 }, { index: 0, word: "one" }])(
    "should reject the body %o",
    (body) => {
      expect(revealDtoSchema.safeParse(body).success).toBe(false);
    },
  );
});

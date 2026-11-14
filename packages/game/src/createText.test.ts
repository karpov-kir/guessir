import { describe, expect, it } from "vitest";

import { createTextDtoSchema } from "./createText.js";

const validText = { title: "Title", description: "Description", text: "Text" };

/**
 * Returns the messages of the problems `field` has when it holds `value` and the others are valid.
 */
const problems = (field: string, value: unknown) =>
  (createTextDtoSchema.safeParse({ ...validText, [field]: value }).error?.issues ?? [])
    .filter(({ path }) => path[0] === field)
    .map(({ message }) => message);

describe("createTextDtoSchema", () => {
  it("should read a text and take a left-out flag as false", () => {
    expect(createTextDtoSchema.parse(validText)).toEqual({
      ...validText,
      allowShowingFirstLetters: false,
      allowShowingText: false,
    });
  });

  it("should read a text without a description", () => {
    expect(createTextDtoSchema.parse({ title: "Title", text: "Text" })).not.toHaveProperty(
      "description",
    );
  });

  it("should accept an empty description", () => {
    expect(problems("description", "")).toEqual([]);
  });

  it.each([
    { field: "title", value: "" },
    { field: "title", value: undefined },
    { field: "text", value: "" },
    { field: "text", value: 5 },
    { field: "description", value: {} },
    { field: "description", value: null },
    { field: "allowShowingFirstLetters", value: "yes" },
    { field: "allowShowingText", value: 1 },
  ])("should reject a text whose $field is $value", ({ field, value }) => {
    expect(problems(field, value)).not.toEqual([]);
  });

  it("should reject a field it does not know", () => {
    expect(createTextDtoSchema.safeParse({ ...validText, extra: "field" }).error?.issues).toEqual([
      expect.objectContaining({ message: 'Unrecognized key: "extra"' }),
    ]);
  });

  it.each([
    { field: "title", maxLength: 500 },
    { field: "description", maxLength: 4000 },
    { field: "text", maxLength: 4000 },
  ])(
    "should count $field in code points, as Postgres counts varchar($maxLength)",
    ({ field, maxLength }) => {
      // The string is one code point over `maxLength` once its variation selectors count, as
      // Postgres counts them. Each emoji is two UTF-16 units but one code point.
      const withSelectors = "a️".repeat(maxLength / 2) + "︎";
      const emoji = "\u{1F600}".repeat(maxLength);

      expect(problems(field, withSelectors)).toEqual([
        `Too big: expected string to have <=${maxLength} characters`,
      ]);
      expect(problems(field, emoji)).toEqual([]);
      expect(problems(field, `${emoji}a`)).not.toEqual([]);
    },
  );

  it.each(["title", "description", "text"])(
    "should reject U+0000 in %s, which Postgres cannot store",
    (field) => {
      expect(problems(field, "one\u0000two")).toEqual([
        "Invalid string: must not contain the character U+0000",
      ]);
    },
  );
});

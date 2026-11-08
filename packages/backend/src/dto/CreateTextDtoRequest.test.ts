import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, expect, it } from "vitest";

import { CreateTextDtoRequest } from "./CreateTextDtoRequest.js";

describe(CreateTextDtoRequest, () => {
  it("should throw correct validation errors", async () => {
    expect(await validate(plainToInstance(CreateTextDtoRequest, {}))).toEqual([
      expect.objectContaining({
        constraints: {
          isNotEmpty: "title should not be empty",
          maxLength: "title must be shorter than or equal to 500 characters",
        },
      }),
      expect.objectContaining({
        constraints: {
          isNotEmpty: "text should not be empty",
          maxLength: "text must be shorter than or equal to 4000 characters",
        },
      }),
    ]);

    expect(
      await validate(
        plainToInstance(CreateTextDtoRequest, {
          allowShowingFirstLetters: "test",
          allowShowingText: "test",
          description: {},
        }),
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          constraints: {
            maxLength: "description must be shorter than or equal to 4000 characters",
          },
        }),
        expect.objectContaining({
          constraints: {
            isBoolean: "allowShowingFirstLetters must be a boolean value",
          },
        }),
        expect.objectContaining({
          constraints: {
            isBoolean: "allowShowingText must be a boolean value",
          },
        }),
      ]),
    );
  });
});

describe(`${CreateTextDtoRequest.name} as the database stores it`, () => {
  const validText = { title: "Title", description: "Description", text: "Text" };

  /** Returns the constraints that fail on `field` once it holds `value`. */
  const failedConstraints = async (field: string, value: string) => {
    const errors = await validate(
      plainToInstance(CreateTextDtoRequest, { ...validText, [field]: value }),
    );

    return errors.find((error) => error.property === field)?.constraints;
  };

  it.each([
    { field: "title", maxLength: 500 },
    { field: "description", maxLength: 4000 },
    { field: "text", maxLength: 4000 },
  ])(
    "should count $field in code points, as Postgres counts varchar($maxLength)",
    async ({ field, maxLength }) => {
      // A variation selector is a code point of its own in Postgres, while `validator` skips it when it counts
      const withSelectors = "a️".repeat(maxLength / 2) + "︎";
      const emoji = "\u{1F600}".repeat(maxLength);

      expect(await failedConstraints(field, withSelectors)).toEqual({
        maxLength: `${field} must be shorter than or equal to ${maxLength} characters`,
      });
      expect(await failedConstraints(field, emoji)).toBeUndefined();
      expect(await failedConstraints(field, `${emoji}a`)).toHaveProperty("maxLength");
    },
  );

  it.each(["title", "description", "text"])(
    "should reject U+0000 in %s, which Postgres cannot store",
    async (field) => {
      expect(await failedConstraints(field, "one\u0000two")).toEqual({
        hasNoNullCharacter: `${field} must not contain the character U+0000`,
      });
    },
  );
});

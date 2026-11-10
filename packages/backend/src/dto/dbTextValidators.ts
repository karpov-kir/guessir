import { buildMessage, ValidateBy, ValidationOptions } from "class-validator";

/**
 * Checks that a value is a string of at most `max` code points, the length Postgres gives a
 * varchar. `MaxLength` of class-validator skips U+FE0E and U+FE0F, so a text that it accepts can
 * overflow the column.
 */
export function MaxCodePoints(
  max: number,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      // This check takes the name of class-validator's `MaxLength`. A client then gets a too-long
      // value under the `maxLength` key on every DTO.
      name: "maxLength",
      constraints: [max],
      validator: {
        validate: (value) => typeof value === "string" && [...value].length <= max,
        defaultMessage: buildMessage(
          (eachPrefix) =>
            `${eachPrefix}$property must be shorter than or equal to $constraint1 characters`,
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}

/**
 * Checks that a string holds no U+0000, and passes a value that is not a string. Postgres rejects
 * U+0000 in a text column.
 */
export function HasNoNullCharacter(validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: "hasNoNullCharacter",
      validator: {
        validate: (value) => typeof value !== "string" || !value.includes("\u0000"),
        defaultMessage: buildMessage(
          (eachPrefix) => `${eachPrefix}$property must not contain the character U+0000`,
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}

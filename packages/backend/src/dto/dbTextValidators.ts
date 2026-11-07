import { buildMessage, ValidateBy, ValidationOptions } from 'class-validator';

/**
 * Checks that a string has at most `max` code points, the way Postgres counts the length of a varchar.
 * `MaxLength` of class-validator does not count U+FE0E and U+FE0F, so a text it accepts can overflow the column.
 */
export function MaxCodePoints(max: number, validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'maxLength',
      constraints: [max],
      validator: {
        validate: (value) => typeof value === 'string' && [...value].length <= max,
        defaultMessage: buildMessage(
          (eachPrefix) => `${eachPrefix}$property must be shorter than or equal to $constraint1 characters`,
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}

/** Checks that a string holds no U+0000. Postgres rejects that character in a text column. */
export function HasNoNullCharacter(validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'hasNoNullCharacter',
      validator: {
        validate: (value) => typeof value !== 'string' || !value.includes('\u0000'),
        defaultMessage: buildMessage(
          (eachPrefix) => `${eachPrefix}$property must not contain the character U+0000`,
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateTextDto } from './CreateTextDto';

describe(CreateTextDto, () => {
  it('should throw correct validation errors', async () => {
    expect(await validate(plainToInstance(CreateTextDto, {}))).toEqual([
      expect.objectContaining({
        constraints: {
          isNotEmpty: 'title should not be empty',
          maxLength: 'title must be shorter than or equal to 500 characters',
        },
      }),
      expect.objectContaining({
        constraints: {
          isNotEmpty: 'text should not be empty',
          maxLength: 'text must be shorter than or equal to 4000 characters',
        },
      }),
    ]);

    expect(
      await validate(
        plainToInstance(CreateTextDto, {
          allowShowingFirstLetters: 'test',
          allowShowingText: 'test',
          description: {},
        }),
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          constraints: {
            maxLength: 'description must be shorter than or equal to 4000 characters',
          },
        }),
        expect.objectContaining({
          constraints: {
            isBoolean: 'allowShowingFirstLetters must be a boolean value',
          },
        }),
        expect.objectContaining({
          constraints: {
            isBoolean: 'allowShowingText must be a boolean value',
          },
        }),
      ]),
    );
  });
});

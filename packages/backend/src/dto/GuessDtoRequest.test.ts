import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { GuessDtoRequest } from './GuessDtoRequest';

describe(GuessDtoRequest, () => {
  it('should accept a word', async () => {
    expect(await validate(plainToInstance(GuessDtoRequest, { word: 'one' }))).toEqual([]);
  });

  it.each([
    { word: undefined, constraint: 'isString' },
    { word: 3, constraint: 'isString' },
    { word: '', constraint: 'isNotEmpty' },
    { word: 'a'.repeat(101), constraint: 'maxLength' },
  ])('should reject the word $word with $constraint', async ({ word, constraint }) => {
    const [error] = await validate(plainToInstance(GuessDtoRequest, { word }));

    expect(error.constraints).toHaveProperty(constraint);
  });
});

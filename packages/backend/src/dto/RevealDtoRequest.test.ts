import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { RevealDtoRequest } from './RevealDtoRequest';

describe(RevealDtoRequest, () => {
  it('should accept an index', async () => {
    expect(await validate(plainToInstance(RevealDtoRequest, { index: 0 }))).toEqual([]);
  });

  it.each([
    { index: undefined, constraint: 'isInt' },
    { index: '1', constraint: 'isInt' },
    { index: 1.5, constraint: 'isInt' },
    { index: -1, constraint: 'min' },
  ])('should reject the index $index with $constraint', async ({ index, constraint }) => {
    const [error] = await validate(plainToInstance(RevealDtoRequest, { index }));

    expect(error.constraints).toHaveProperty(constraint);
  });
});

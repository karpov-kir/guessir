import { ValidationPipe } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { QueryErrorFilter } from './QueryErrorFilter';
import { useGlobals } from './useGlobals';

describe(useGlobals, () => {
  it('should register the validation pipe and the filter that keeps query parameters out of the logs', () => {
    const app = { useGlobalPipes: vi.fn(), useGlobalFilters: vi.fn() };

    useGlobals(app);

    expect(app.useGlobalPipes).toBeCalledWith(expect.any(ValidationPipe));
    expect(app.useGlobalFilters).toBeCalledWith(expect.any(QueryErrorFilter));
  });
});

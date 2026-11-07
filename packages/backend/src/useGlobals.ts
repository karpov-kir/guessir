import { INestApplication, ValidationPipe } from '@nestjs/common';

import { QueryErrorFilter } from './QueryErrorFilter';

/**
 * Registers the app-wide validation and the failed-query filter. Apart from `boot`, which tests do not run,
 * so a test can guard that the filter keeping the texts out of the logs stays registered.
 */
export function useGlobals(app: Pick<INestApplication, 'useGlobalPipes' | 'useGlobalFilters'>) {
  app.useGlobalPipes(
    new ValidationPipe({
      // If set to true, validator will strip validated (returned) object of any properties that do not use any validation decorators
      whitelist: true,
      // With the auto-transformation option enabled, the ValidationPipe will also perform conversion of primitive types
      transform: false,
      // If set to true, instead of stripping non-whitelisted properties validator will throw an exception
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new QueryErrorFilter());
}

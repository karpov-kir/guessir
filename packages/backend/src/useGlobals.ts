import { INestApplication, ValidationPipe } from '@nestjs/common';

import { QueryErrorFilter } from './QueryErrorFilter';

/**
 * Registers the app-wide validation pipe and the failed-query filter. It lives apart from `boot`, which tests do not
 * run, so a test can check that the filter that keeps the texts out of the logs stays registered.
 */
export function useGlobals(app: Pick<INestApplication, 'useGlobalPipes' | 'useGlobalFilters'>) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new QueryErrorFilter());
}

import { Logger as NestLogger } from '@nestjs/common';
import { Logger } from 'typeorm';

/**
 * Logs TypeORM's failed queries, warnings, schema builds and migrations, and never a query's parameters.
 * The parameters carry the stored texts, which are the answers to the games.
 */
export class ParameterFreeLogger implements Logger {
  private readonly logger = new NestLogger('typeorm');

  logQuery() {}

  logQueryError(error: string | Error, query: string) {
    this.logger.error(`Query failed: ${String(error)}; ${query}`);
  }

  logQuerySlow() {}

  logSchemaBuild(message: string) {
    this.logger.log(message);
  }

  logMigration(message: string) {
    this.logger.log(message);
  }

  log(level: 'log' | 'info' | 'warn', message: unknown) {
    if (level === 'warn') {
      this.logger.warn(String(message));
    }
  }
}

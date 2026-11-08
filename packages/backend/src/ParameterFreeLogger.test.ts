import { Logger } from '@nestjs/common';
import { Logger as TypeOrmLogger } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ParameterFreeLogger } from './ParameterFreeLogger.js';

const secretText = 'the whole hidden text of a game';
const insertQuery = 'INSERT INTO texts VALUES ($1)';
// The tests hold the logger as TypeORM's `Logger`, because TypeORM passes the query's parameters to `logQuery`,
// `logQueryError` and `logQuerySlow`, which the class declares without them
let parameterFreeLogger: TypeOrmLogger;

describe(ParameterFreeLogger, () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    parameterFreeLogger = new ParameterFreeLogger();
  });

  it('should log a failed query with its error but without its parameters', () => {
    parameterFreeLogger.logQueryError(new Error('connection lost'), insertQuery, [secretText]);

    expect(Logger.prototype.error).toBeCalledTimes(1);
    expect(Logger.prototype.error).toBeCalledWith(
      'Query failed: Error: connection lost; INSERT INTO texts VALUES ($1)',
    );
  });

  it('should not log successful or slow queries, whose parameters carry the texts', () => {
    parameterFreeLogger.logQuery(insertQuery, [secretText]);
    parameterFreeLogger.logQuerySlow(5_000, insertQuery, [secretText]);

    expect(Logger.prototype.error).not.toBeCalled();
    expect(Logger.prototype.warn).not.toBeCalled();
    expect(Logger.prototype.log).not.toBeCalled();
  });

  it('should log only the warnings among the messages TypeORM reports on its own', () => {
    parameterFreeLogger.log('warn', 'deprecated option');
    parameterFreeLogger.log('info', 'connected');
    parameterFreeLogger.log('log', 'connected');

    expect(Logger.prototype.warn).toBeCalledWith('deprecated option');
    expect(Logger.prototype.log).not.toBeCalled();
  });

  it('should log schema builds and migrations', () => {
    parameterFreeLogger.logSchemaBuild('schema built');
    parameterFreeLogger.logMigration('migration applied');

    expect(Logger.prototype.log).toBeCalledWith('schema built');
    expect(Logger.prototype.log).toBeCalledWith('migration applied');
  });
});

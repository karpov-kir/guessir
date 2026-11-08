import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { QueryFailedError } from 'typeorm';

/**
 * Answers a failed query with the 500 that Nest's default handler gives, and logs it without its parameters.
 * The default handler logs the whole `QueryFailedError`, and its `parameters` and `driverError.detail` carry the
 * stored texts, which are the answers to the games.
 */
@Catch(QueryFailedError)
export class QueryErrorFilter implements ExceptionFilter<QueryFailedError> {
  private static readonly logger = new Logger('ExceptionsHandler');

  catch(error: QueryFailedError, host: ArgumentsHost) {
    const code = 'code' in error.driverError ? String(error.driverError.code) : undefined;

    QueryErrorFilter.logger.error(`Query failed: ${error.name}: ${error.message}; ${error.query}; code ${code}`);
    host
      .switchToHttp()
      .getResponse<FastifyReply>()
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error' });
  }
}

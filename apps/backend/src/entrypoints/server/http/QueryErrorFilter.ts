import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import type { FastifyReply } from "fastify";

import { QueryError } from "#/infra/db/exports.js";
import { Logger } from "@guessir/logger";

/**
 * Answers a failed query with the 500 of Nest's default handler, and logs one line with the
 * query's SQL and SQLSTATE code.
 */
@Catch(QueryError)
export class QueryErrorFilter implements ExceptionFilter<QueryError> {
  // The logger takes the scope of Nest's own exception handler. A failed query then logs under the
  // same scope as any other unhandled error.
  private static readonly logger = Logger.root.scope("ExceptionsHandler");

  catch(error: QueryError, host: ArgumentsHost) {
    QueryErrorFilter.logger.error(
      `Query failed: ${error.name}: ${error.message}; ${error.query}; code ${error.code}`,
    );
    host
      .switchToHttp()
      .getResponse<FastifyReply>()
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Internal server error" });
  }
}

import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { QueryError } from "../../../infra/db/exports.js";

/**
 * Answers a failed query with the 500 of Nest's default handler, and logs one line with the
 * query's SQL and SQLSTATE code.
 */
@Catch(QueryError)
export class QueryErrorFilter implements ExceptionFilter<QueryError> {
  private static readonly logger = new Logger("ExceptionsHandler");

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

import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { QueryFailedError } from "typeorm";

/**
 * Answers a failed query with the 500 of Nest's default handler, and logs the query without its
 * parameters. The default handler logs the whole error, and its `parameters` and
 * `driverError.detail` carry the stored texts. These texts are the answers to the games.
 */
@Catch(QueryFailedError)
export class QueryErrorFilter implements ExceptionFilter<QueryFailedError> {
  private static readonly logger = new Logger("ExceptionsHandler");

  catch(error: QueryFailedError, host: ArgumentsHost) {
    // pg gives the SQLSTATE in `code` as a string
    const code =
      "code" in error.driverError && typeof error.driverError.code === "string"
        ? error.driverError.code
        : undefined;

    QueryErrorFilter.logger.error(
      `Query failed: ${error.name}: ${error.message}; ${error.query}; code ${code}`,
    );
    host
      .switchToHttp()
      .getResponse<FastifyReply>()
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .send({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: "Internal server error" });
  }
}

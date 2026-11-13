import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import type { FastifyReply } from "fastify";

import {
  HintNotAllowedError,
  TextNotFoundError,
  WordNotFoundError,
} from "../../../features/texts/exports.js";

/** Answers the texts feature's errors with the HTTP status each one means. */
@Catch(TextNotFoundError, WordNotFoundError, HintNotAllowedError)
export class TextErrorFilter implements ExceptionFilter<Error> {
  catch(error: Error, host: ArgumentsHost) {
    const statusCode =
      error instanceof HintNotAllowedError ? HttpStatus.FORBIDDEN : HttpStatus.NOT_FOUND;

    // The body has the keys, in their order, of Nest's own 403 and 404 answers
    host
      .switchToHttp()
      .getResponse<FastifyReply>()
      .status(statusCode)
      .send({
        message: statusCode === HttpStatus.FORBIDDEN ? "Forbidden" : "Not Found",
        statusCode,
      });
  }
}

import { Controller, Get, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { collectLogs } from "@guessir/logger/testing";
import { QueryError } from "#src/infra/db/exports.js";
import { Logger, LogLevel } from "@guessir/logger";
import { nestLogger } from "./nestLogger.js";
import { QueryErrorFilter } from "./QueryErrorFilter.js";

const insertQuery = 'INSERT INTO "texts"("title", "text") VALUES ($1, $2)';
const otherError = new Error("not a query");

@Controller()
class FailingController {
  @Get("query")
  failQuery(): never {
    throw new QueryError({
      message: "SQLSTATE 22001",
      query: insertQuery,
      code: "22001",
    });
  }

  @Get("other")
  failOther(): never {
    throw otherError;
  }
}

@Module({ controllers: [FailingController] })
class FailingModule {}

describe(QueryErrorFilter, () => {
  let app: NestFastifyApplication;
  let logs: ReturnType<typeof collectLogs>;

  beforeAll(async () => {
    app = await NestFactory.create<NestFastifyApplication>(FailingModule, new FastifyAdapter(), {
      logger: nestLogger,
    });
    app.useGlobalFilters(new QueryErrorFilter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    logs = collectLogs();
    Logger.install(logs.sink, LogLevel.Info);
  });

  it("should answer a failed query with Nest's own 500 and log its SQL and code", async () => {
    const response = await app.inject({ method: "GET", url: "/query" });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ statusCode: 500, message: "Internal server error" });
    expect(logs.lines(LogLevel.Error)).toEqual([
      {
        kind: "line",
        level: LogLevel.Error,
        scope: ["ExceptionsHandler"],
        args: [`Query failed: QueryError: SQLSTATE 22001; ${insertQuery}; code 22001`],
      },
    ]);
  });

  it("should leave every other error to Nest's default handler", async () => {
    const response = await app.inject({ method: "GET", url: "/other" });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ statusCode: 500, message: "Internal server error" });
    expect(logs.lines(LogLevel.Error)).toEqual([
      { kind: "line", level: LogLevel.Error, scope: ["ExceptionsHandler"], args: [otherError] },
    ]);
  });
});

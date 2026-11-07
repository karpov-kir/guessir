import { inspect } from 'node:util';

import { Controller, Get, Logger, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { QueryFailedError } from 'typeorm';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { QueryErrorFilter } from './QueryErrorFilter';

const secretText = 'the whole hidden text of a game';
const insertQuery = 'INSERT INTO "texts"("title", "text") VALUES ($1, $2)';
const otherError = new Error('not a query');

@Controller()
class FailingController {
  @Get('query')
  failQuery(): never {
    const driverError = Object.assign(new Error('value too long for type character varying(4000)'), {
      code: '22001',
      detail: `Failing row contains (${secretText}).`,
    });

    throw new QueryFailedError(insertQuery, ['Title', secretText], driverError);
  }

  @Get('other')
  failOther(): never {
    throw otherError;
  }
}

@Module({ controllers: [FailingController] })
class FailingModule {}

describe(QueryErrorFilter, () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await NestFactory.create<NestFastifyApplication>(FailingModule, new FastifyAdapter(), { logger: false });
    app.useGlobalFilters(new QueryErrorFilter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  it("should answer a failed query with Nest's own 500 and log it without the text", async () => {
    const response = await app.inject({ method: 'GET', url: '/query' });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ statusCode: 500, message: 'Internal server error' });
    expect(Logger.prototype.error).toBeCalledTimes(1);
    expect(inspect(vi.mocked(Logger.prototype.error).mock.calls, { depth: Infinity })).not.toContain(secretText);
    expect(Logger.prototype.error).toBeCalledWith(
      `Query failed: QueryFailedError: value too long for type character varying(4000); ${insertQuery}; code 22001`,
    );
  });

  it("should leave every other error to Nest's default handler", async () => {
    const response = await app.inject({ method: 'GET', url: '/other' });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ statusCode: 500, message: 'Internal server error' });
    expect(Logger.prototype.error).toBeCalledWith(otherError);
  });
});

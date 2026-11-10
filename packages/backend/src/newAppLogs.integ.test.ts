import { Module } from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { afterEach, expect, it, vi } from "vitest";

import { mockRepository } from "../tests/utils/mockRepository.js";
import { TextsController } from "./controllers/TextController.js";
import { TextEntity } from "./entities/TextEntity.js";
import { newApp } from "./newApp.js";

const visitorIp = "203.0.113.7";
const text: TextEntity = {
  pk: 1,
  id: "text-id",
  title: "Title",
  text: "One two",
  allowShowingFirstLetters: true,
  allowShowingText: true,
  updatedAt: new Date(),
  createdAt: new Date(),
};
const textsRepository: Repository<TextEntity> = mockRepository<TextEntity>();

@Module({
  controllers: [TextsController],
  providers: [{ provide: getRepositoryToken(TextEntity), useValue: textsRepository }],
})
class TestModule {}

afterEach(() => {
  vi.restoreAllMocks();
});

it("should log each request by its method, URL and status, without the visitor's IP", async () => {
  const output: string[] = [];
  const capture = ((chunk: string | Uint8Array) => {
    output.push(String(chunk));
    return true;
  }) as typeof process.stdout.write;
  vi.spyOn(process.stdout, "write").mockImplementation(capture);
  vi.spyOn(process.stderr, "write").mockImplementation(capture);
  const warnings: string[] = [];
  const onWarning = (warning: Error) => warnings.push(`${warning.name} ${warning.message}`);
  process.on("warning", onWarning);
  const fastifyLines: string[] = [];
  vi.spyOn(textsRepository, "findOne").mockResolvedValue(text);
  vi.spyOn(textsRepository, "save").mockRejectedValue(new Error("The database is down"));

  const app = await newApp(TestModule, {
    logger: {
      stream: {
        write: (line) => {
          fastifyLines.push(line);
          output.push(line);
        },
      },
    },
  });
  await app.init();
  const fastify = app.getHttpAdapter().getInstance();
  await fastify.ready();
  const fromVisitor = { remoteAddress: visitorIp, headers: { "x-forwarded-for": visitorIp } };
  const found = await fastify.inject({ method: "GET", url: "/texts/text-id", ...fromVisitor });
  const failed = await fastify.inject({
    method: "POST",
    url: "/texts",
    ...fromVisitor,
    payload: {
      title: "Title",
      text: "One two",
      allowShowingFirstLetters: true,
      allowShowingText: true,
    },
  });
  await app.close();
  process.off("warning", onWarning);

  const logs = fastifyLines.map((line) => JSON.parse(line) as { req?: object; res?: object });
  expect([found.statusCode, failed.statusCode]).toEqual([200, 500]);
  expect(logs.filter((log) => log.req).map((log) => log.req)).toEqual([
    { method: "GET", url: "/texts/text-id" },
    { method: "POST", url: "/texts" },
  ]);
  expect(logs.filter((log) => log.res).map((log) => log.res)).toEqual([
    { statusCode: 200 },
    { statusCode: 500 },
  ]);
  expect(output.join("")).toContain("The database is down");
  expect(output.join("")).not.toContain(visitorIp);
  expect(output.join("")).not.toContain("127.0.0.1");
  expect([...warnings, ...output].join("")).not.toContain("FSTDEP");
});

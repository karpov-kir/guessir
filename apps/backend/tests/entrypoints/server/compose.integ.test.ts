import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { collectLogs } from "@guessir/logger/testing";
import { fakeTextRows, type FakeTextRows } from "../../utils/fakeTextRows.js";
import { testConfig } from "../../utils/testConfig.js";
import { Text } from "../../../src/features/texts/exports.js";
import { QueryError } from "../../../src/infra/db/exports.js";
import { version } from "../../../src/infra/version.js";
import { LogLevel } from "@guessir/logger";
import { compose, ServerHandle } from "../../../src/entrypoints/server/compose.js";

const text: Text = {
  id: "text-id",
  title: "Title",
  text: "One two",
  allowShowingFirstLetters: true,
  allowShowingText: true,
};
let textRows: FakeTextRows;
let logs: ReturnType<typeof collectLogs>;

describe("the texts API over HTTP", () => {
  let server: ServerHandle;
  const request = (
    method: "GET" | "HEAD" | "POST",
    url: string,
    payload?: object,
    headers?: Record<string, string>,
  ) => server.handle({ method, url, payload, headers });

  beforeAll(async () => {
    textRows = fakeTextRows([text, { ...text, id: "locked", allowShowingText: false }]);
    logs = collectLogs();
    server = await compose({ textRows, env: {}, config: testConfig(), logSink: logs.sink });
  });

  afterAll(() => server.stop());

  it("should create a text and answer only its id", async () => {
    const response = await request("POST", "/texts", {
      title: "Title",
      text: "One two",
      allowShowingFirstLetters: true,
      allowShowingText: true,
    });

    const { id } = response.json<{ id: string }>();

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({ id });
    expect(id).toMatch(/^[\w-]{20}$/);
    expect(await textRows.getById(id)).toEqual({
      id,
      title: "Title",
      text: "One two",
      allowShowingFirstLetters: true,
      allowShowingText: true,
    });
  });

  it.each([
    { route: "an unknown text", method: "GET" as const, url: "/texts/unknown", status: 404 },
    {
      route: "a hint the text does not allow",
      method: "GET" as const,
      url: "/texts/locked/words",
      status: 403,
    },
    {
      route: "an index that holds no word",
      method: "POST" as const,
      url: "/texts/text-id/reveals",
      payload: { index: 1 },
      status: 404,
    },
  ])("should answer $status for $route", async ({ method, url, payload, status }) => {
    const response = await request(method, url, payload);

    expect(response.statusCode).toBe(status);
    expect(response.json()).toEqual({
      statusCode: status,
      message: status === 403 ? "Forbidden" : "Not Found",
    });
  });

  it("should send the security headers and allow the origin the config lists", async () => {
    const response = await request("GET", "/texts/text-id", undefined, {
      origin: "https://web.test",
    });

    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["access-control-allow-origin"]).toBe("https://web.test");
  });

  it("should refuse an origin the config does not allow", async () => {
    const response = await request("GET", "/texts/text-id", undefined, {
      origin: "https://elsewhere.example",
    });

    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("should answer and log a failed query without the text it carried", async () => {
    textRows.failOnce(
      "insert",
      new QueryError({ message: "value too long", query: 'INSERT INTO "texts"' }),
    );

    const response = await request("POST", "/texts", {
      title: "Title",
      text: "One two",
      allowShowingFirstLetters: true,
      allowShowingText: true,
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ statusCode: 500, message: "Internal server error" });
    expect(logs.lines(LogLevel.Error)).not.toEqual([]);
    expect(JSON.stringify(logs.lines())).not.toContain("One two");
  });

  it("should log the config and each request through the sink it was given", async () => {
    await request("GET", "/health");

    const infoLines = logs.lines(LogLevel.Info);

    expect(infoLines).toContainEqual(
      expect.objectContaining({ scope: ["server"], args: [expect.stringMatching(/^Config: /)] }),
    );
    expect(infoLines).toContainEqual(
      expect.objectContaining({
        scope: ["http"],
        args: [expect.stringMatching(/^GET \/health 200 in \d+ms$/)],
      }),
    );
  });

  it("should answer the running version on /health", async () => {
    const response = await request("GET", "/health");

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ version });
  });

  it("should not list texts", async () => {
    expect((await request("GET", "/texts")).statusCode).toBe(404);
  });

  it("should not answer HEAD, which no route limit covers", async () => {
    expect((await request("HEAD", "/texts/text-id")).statusCode).toBe(404);
  });

  it("should play a text through the routes the web client calls", async () => {
    const skeleton = await request("GET", "/texts/text-id");
    const guess = await request("POST", "/texts/text-id/guesses", { word: "one" });
    const reveal = await request("POST", "/texts/text-id/reveals", { index: 2 });
    const firstLetters = await request("GET", "/texts/text-id/first-letters");
    const words = await request("GET", "/texts/text-id/words");

    expect(skeleton.json()).toMatchObject({
      lexemes: [
        { index: 0, length: 3 },
        { index: 1, character: " " },
        { index: 2, length: 3 },
      ],
    });
    expect(skeleton.body).not.toMatch(/one|two/i);
    expect([
      guess.statusCode,
      reveal.statusCode,
      firstLetters.statusCode,
      words.statusCode,
    ]).toEqual([200, 200, 200, 200]);
    expect(guess.json()).toEqual({ words: [{ index: 0, word: "One" }] });
    expect(reveal.json()).toEqual({ index: 2, word: "two" });
    expect(firstLetters.json()).toEqual({
      words: [
        { index: 0, word: "O" },
        { index: 2, word: "t" },
      ],
    });
    expect(words.json()).toEqual({
      words: [
        { index: 0, word: "One" },
        { index: 2, word: "two" },
      ],
    });
  });

  it.each([
    { route: "guesses", payload: { word: "" } },
    { route: "guesses", payload: { word: "one", index: 0 } },
    { route: "reveals", payload: { index: "0" } },
    { route: "reveals", payload: { index: -1 } },
  ])("should reject the $route body $payload", async ({ route, payload }) => {
    const response = await request("POST", `/texts/text-id/${route}`, payload);

    expect(response.statusCode).toBe(400);
  });

  it("should answer an invalid body with one message per problem", async () => {
    const response = await request("POST", "/texts", { title: "", allowShowingText: "yes" });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      message: [
        "title: Invalid string: must not be blank",
        "text: Invalid input: expected string, received undefined",
        "allowShowingText: Invalid input: expected boolean, received string",
      ],
      error: "Bad Request",
      statusCode: 400,
    });
  });

  it.each([
    ["title", "  ", "Invalid string: must not be blank"],
    ["text", "\n\t", "Invalid string: must not be blank"],
    ["description", null, "Invalid input: expected string, received null"],
    ["description", "", "Invalid string: must not be blank"],
    ["description", "  ", "Invalid string: must not be blank"],
  ])("should refuse the %s %j and store nothing", async (field, value, problem) => {
    const storedCount = textRows.texts.size;

    const response = await request("POST", "/texts", {
      title: "Title",
      text: "One two",
      [field]: value,
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<{ message: string[] }>().message).toEqual([`${field}: ${problem}`]);
    expect(textRows.texts.size).toBe(storedCount);
  });

  it("should store a text sent without flags as one that shows no hints", async () => {
    const response = await request("POST", "/texts", { title: "Title", text: "One two" });
    const { id } = response.json<{ id: string }>();

    expect(response.statusCode).toBe(201);
    expect(await textRows.getById(id)).toMatchObject({
      allowShowingFirstLetters: false,
      allowShowingText: false,
    });
  });
});

describe("the server's log", () => {
  it("should drop the records below the config's level", async () => {
    const logs = collectLogs();
    const server = await compose({
      textRows: fakeTextRows([]),
      env: {},
      config: { ...testConfig(), log: { ...testConfig().log, level: LogLevel.Warn } },
      logSink: logs.sink,
    });

    await server.handle({ method: "GET", url: "/health" });
    await server.stop();

    // The server logs which env file it read before it parses the config, so the default level
    // keeps that line.
    expect(logs.lines()).toEqual([expect.objectContaining({ args: ["Read no env file"] })]);
  });
});

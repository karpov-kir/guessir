import { Logger } from "@nestjs/common";
import { QueryFailedError } from "typeorm";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { fakeTextRows } from "../../../tests/utils/fakeTextRows.js";
import { Text } from "../../features/texts/exports.js";
import { version } from "./version.js";
import { compose, ServerHandle } from "./compositionRoot.js";

const text: Text = {
  id: "text-id",
  title: "Title",
  text: "One two",
  allowShowingFirstLetters: true,
  allowShowingText: true,
};
let textRows: ReturnType<typeof fakeTextRows>;

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
    server = await compose({ textRows, logger: false });
  });

  afterAll(() => server.stop());

  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it("should send the security headers and allow the web origin", async () => {
    const response = await request("GET", "/texts/text-id", undefined, {
      origin: "https://guessir.kk-forge.com",
    });

    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["access-control-allow-origin"]).toBe("https://guessir.kk-forge.com");
  });

  it("should answer and log a failed query without the text it carried", async () => {
    const errorLog = vi.spyOn(Logger.prototype, "error");

    textRows.insert.mockRejectedValueOnce(
      new QueryFailedError('INSERT INTO "texts"', ["One two"], new Error("value too long")),
    );

    const response = await request("POST", "/texts", {
      title: "Title",
      text: "One two",
      allowShowingFirstLetters: true,
      allowShowingText: true,
    });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({ statusCode: 500, message: "Internal server error" });
    expect(errorLog).toHaveBeenCalled();
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain("One two");
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
        "title: Too small: expected string to have >=1 characters",
        "text: Invalid input: expected string, received undefined",
        "allowShowingText: Invalid input: expected boolean, received string",
      ],
      error: "Bad Request",
      statusCode: 400,
    });
  });

  it.each([
    [null, "Invalid input: expected string, received null"],
    ["", "Invalid string: must not be blank"],
    ["  ", "Invalid string: must not be blank"],
  ])("should refuse the description %j and store nothing", async (description, problem) => {
    textRows.insert.mockClear();

    const response = await request("POST", "/texts", {
      title: "Title",
      description,
      text: "One two",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<{ message: string[] }>().message).toEqual([`description: ${problem}`]);
    expect(textRows.insert).not.toHaveBeenCalled();
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

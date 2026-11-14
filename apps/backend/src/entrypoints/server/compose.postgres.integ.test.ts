import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startMigratedPostgres, TestPostgres } from "../../../tests/utils/postgres.js";
import { testConfig } from "../../../tests/utils/testConfig.js";
import { compose, ServerHandle } from "./compose.js";

describe("the server over Postgres", () => {
  let postgres: TestPostgres;
  let server: ServerHandle;

  beforeAll(async () => {
    postgres = await startMigratedPostgres();
    server = await compose({ config: testConfig(postgres.settings), logger: false });
    // The test config's port 0 lets the system pick a free port
    await server.start();
  }, 120_000);

  afterAll(async () => {
    await server?.stop();
    await postgres?.stop();
  });

  it("should store a text and play it back", async () => {
    const created = await server.handle({
      method: "POST",
      url: "/texts",
      payload: {
        title: "Title",
        text: "One two one",
        allowShowingFirstLetters: true,
        allowShowingText: true,
      },
    });
    const { id } = created.json<{ id: string }>();
    const guess = await server.handle({
      method: "POST",
      url: `/texts/${id}/guesses`,
      payload: { word: "one" },
    });

    expect(created.statusCode).toBe(201);
    expect(guess.json()).toEqual({
      words: [
        { index: 0, word: "One" },
        { index: 4, word: "one" },
      ],
    });
  });

  it("should answer a text stored without a description with no description key", async () => {
    const created = await server.handle({
      method: "POST",
      url: "/texts",
      payload: { title: "Title", text: "One two" },
    });
    const skeleton = await server.handle({
      method: "GET",
      url: `/texts/${created.json<{ id: string }>().id}`,
    });

    expect(skeleton.statusCode).toBe(200);
    expect(skeleton.json()).not.toHaveProperty("description");
  });
});

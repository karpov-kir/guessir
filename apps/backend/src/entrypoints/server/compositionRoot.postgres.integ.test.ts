import { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { startPostgres } from "../../../tests/utils/postgres.js";
import { compose, ServerHandle } from "./compositionRoot.js";

describe("the server over Postgres", () => {
  let container: StartedPostgreSqlContainer;
  let server: ServerHandle;

  beforeAll(async () => {
    const postgres = await startPostgres();

    container = postgres.container;
    server = await compose({ dbSettings: postgres.settings, logger: false });
    // Port 0 lets the system pick a free port; start() applies the migrations first
    await server.start("127.0.0.1", 0);
  }, 120_000);

  afterAll(async () => {
    await server?.stop();
    await container?.stop();
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

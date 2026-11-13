import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { FetchHttpClient } from "./fetchHttp";

const idSchema = z.object({ id: z.string() });
const wordsSchema = z.object({ words: z.array(z.string()) });
const newClient = () => new FetchHttpClient("https://api.test/");

describe(FetchHttpClient, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should post the payload as JSON and return the body as the schema reads it", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('{"id":"a","extra":1}', { status: 201 }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(newClient().post("/texts", { title: "T" }, idSchema)).resolves.toEqual({
      id: "a",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.test/texts",
      expect.objectContaining({ method: "POST", body: '{"title":"T"}' }),
    );
  });

  it("should get and return the body as the schema reads it", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(new Response('{"words":[]}')));

    await expect(newClient().get("/texts/x/words", wordsSchema)).resolves.toEqual({ words: [] });
  });

  it.each([
    { method: "get", call: (client: FetchHttpClient) => client.get("/texts/x", idSchema) },
    {
      method: "post",
      call: (client: FetchHttpClient) => client.post("/texts/x/reveals", { index: 0 }, idSchema),
    },
  ])("should reject a $method answered with a non-2xx status", async ({ call }) => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(new Response("", { status: 404 })),
    );

    await expect(call(newClient())).rejects.toThrow("Request failed");
  });

  it.each([
    { method: "get", call: (client: FetchHttpClient) => client.get("/texts/x", idSchema) },
    {
      method: "post",
      call: (client: FetchHttpClient) => client.post("/texts", { title: "T" }, idSchema),
    },
  ])("should reject a $method answer that does not fit the schema", async ({ call }) => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(new Response('{"id":1}')));

    await expect(call(newClient())).rejects.toThrow(
      new Error("Unexpected response from the server"),
    );
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";

import { FetchHttpClient } from "./HttpClient";

describe(FetchHttpClient, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should post the payload as JSON and return the parsed body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"id":"a"}', { status: 201 }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(new FetchHttpClient().post("/texts", { title: "T" })).resolves.toEqual({
      id: "a",
    });
    expect(fetchMock).toBeCalledWith(
      "/texts",
      expect.objectContaining({ method: "POST", body: '{"title":"T"}' }),
    );
  });

  it("should get and return the parsed body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"words":[]}')));

    await expect(new FetchHttpClient().get("/texts/x/words")).resolves.toEqual({ words: [] });
  });

  it.each([
    { method: "get", call: (client: FetchHttpClient) => client.get("/texts/x") },
    {
      method: "post",
      call: (client: FetchHttpClient) => client.post("/texts/x/reveals", { index: 0 }),
    },
  ])("should reject a $method answered with a non-2xx status", async ({ call }) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 404 })));

    await expect(call(new FetchHttpClient())).rejects.toThrow("Request failed");
  });
});

// @vitest-environment node
import { once } from "node:events";
import { createServer, type IncomingMessage, type Server } from "node:http";

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { FetchHttpClient } from "#src/infra/fetchHttp.js";

const idSchema = z.object({ id: z.string() });
const wordsSchema = z.object({ words: z.array(z.string()) });

type ReceivedRequest = { method?: string; url?: string; contentType?: string; body: string };

let server: Server;
let baseUrl: string;
let answer: { status: number; body: string };
let receivedRequests: ReceivedRequest[];

const newClient = () => new FetchHttpClient({ baseUrl: `${baseUrl}/` });

async function receive(request: IncomingMessage): Promise<ReceivedRequest> {
  let body = "";

  for await (const chunk of request) {
    body += String(chunk);
  }

  return {
    method: request.method,
    url: request.url,
    contentType: request.headers["content-type"],
    body,
  };
}

describe(FetchHttpClient, () => {
  beforeAll(async () => {
    server = createServer((request, response) => {
      void receive(request).then((receivedRequest) => {
        receivedRequests.push(receivedRequest);
        response.writeHead(answer.status, { "Content-Type": "application/json" });
        response.end(answer.body);
      });
    });
    server.listen(0, "127.0.0.1");
    await once(server, "listening");

    const address = server.address();

    if (typeof address !== "object" || !address) {
      throw new Error("The test server listens on no TCP port");
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    server.close();
    await once(server, "close");
  });

  beforeEach(() => {
    answer = { status: 200, body: "{}" };
    receivedRequests = [];
  });

  it("should post the payload as JSON and return the body as the schema reads it", async () => {
    answer = { status: 201, body: '{"id":"a","extra":1}' };

    await expect(newClient().post("/texts", { title: "T" }, idSchema)).resolves.toEqual({
      id: "a",
    });
    expect(receivedRequests).toEqual([
      { method: "POST", url: "/texts", contentType: "application/json", body: '{"title":"T"}' },
    ]);
  });

  it("should get and return the body as the schema reads it", async () => {
    answer = { status: 200, body: '{"words":[]}' };

    await expect(newClient().get("/texts/x/words", wordsSchema)).resolves.toEqual({ words: [] });
    expect(receivedRequests).toEqual([
      { method: "GET", url: "/texts/x/words", contentType: undefined, body: "" },
    ]);
  });

  it.each([
    { method: "get", call: (client: FetchHttpClient) => client.get("/texts/x", idSchema) },
    {
      method: "post",
      call: (client: FetchHttpClient) => client.post("/texts/x/reveals", { index: 0 }, idSchema),
    },
  ])("should reject a $method answered with a non-2xx status", async ({ call }) => {
    answer = { status: 404, body: '{"id":"a"}' };

    await expect(call(newClient())).rejects.toThrow("Request failed");
  });

  it.each([
    { method: "get", call: (client: FetchHttpClient) => client.get("/texts/x", idSchema) },
    {
      method: "post",
      call: (client: FetchHttpClient) => client.post("/texts", { title: "T" }, idSchema),
    },
  ])("should reject a $method answer that does not fit the schema", async ({ call }) => {
    answer = { status: 200, body: '{"id":1}' };

    await expect(call(newClient())).rejects.toThrow(
      new Error("Unexpected response from the server"),
    );
  });
});

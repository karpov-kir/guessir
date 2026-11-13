import urlJoin from "url-join";
import type { ZodType } from "zod";

/**
 * Sends HTTP requests to paths under the API's base URL and returns the JSON body as `schema` reads
 * it. Rejects when the response status is not 2xx or the body does not fit `schema`.
 */
export class FetchHttpClient {
  constructor(private readonly baseUrl: string) {}

  async post<T>(path: string, payload: unknown, schema: ZodType<T>): Promise<T> {
    return this.request(path, schema, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async get<T>(path: string, schema: ZodType<T>): Promise<T> {
    return this.request(path, schema, { method: "GET" });
  }

  private async request<T>(path: string, schema: ZodType<T>, init: RequestInit): Promise<T> {
    const response = await fetch(urlJoin(this.baseUrl, path), init);

    if (!response.ok) {
      throw new Error("Request failed");
    }

    const result = schema.safeParse(await response.json());

    if (!result.success) {
      throw new Error("Unexpected response from the server", { cause: result.error });
    }

    return result.data;
  }
}

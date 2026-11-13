import urlJoin from "url-join";

/**
 * Sends HTTP requests to paths under the API's base URL and returns the parsed JSON body. Rejects
 * when the response status is not 2xx.
 */
export interface HttpClient {
  post: (path: string, payload: unknown) => Promise<unknown>;
  get: (path: string) => Promise<unknown>;
}

export class FetchHttpClient implements HttpClient {
  constructor(private readonly baseUrl: string) {}

  async post(path: string, payload: unknown): Promise<unknown> {
    const response = await fetch(urlJoin(this.baseUrl, path), {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Request failed");
    }

    return response.json();
  }

  async get(path: string): Promise<unknown> {
    const response = await fetch(urlJoin(this.baseUrl, path), {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Request failed");
    }

    return response.json();
  }
}

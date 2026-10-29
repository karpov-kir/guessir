export interface HttpClient {
  post: (url: string, payload: unknown) => Promise<unknown>;
  get: (url: string) => Promise<unknown>;
}

/* v8 ignore start */

export class FetchHttpClient implements HttpClient {
  async post(url: string, payload: unknown): Promise<unknown> {
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Request failed');
    }

    return response.json();
  }

  async get(url: string): Promise<unknown> {
    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Request failed');
    }

    return response.json();
  }
}

/* v8 ignore stop */

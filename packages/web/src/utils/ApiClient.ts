/* v8 ignore start */

import { CreateTextDto } from '@guessir/shared/dist/CreateTextDto';
import { Text } from '@guessir/shared/dist/Text';
import urlJoin from 'url-join';

interface HttpClient {
  post: (url: string, payload: unknown) => Promise<unknown>;
  get: (url: string) => Promise<unknown>;
}

class FetchHttpClient implements HttpClient {
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

export class ApiClient {
  constructor(
    private readonly baseUrl = import.meta.env.GUESSIR_API_BASE_URL,
    private readonly httpClient: HttpClient = new FetchHttpClient(),
  ) {}

  async createText(payload: CreateTextDto): Promise<Text> {
    return this.httpClient.post(urlJoin(this.baseUrl, `texts`), payload) as Promise<Text>;
  }

  async loadText(id: string): Promise<Text> {
    return this.httpClient.get(urlJoin(this.baseUrl, `texts/${id}`)) as Promise<Text>;
  }
}

/* v8 ignore stop */

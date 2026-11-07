import { CreateTextDto } from '@guessir/shared/dist/CreateTextDto';
import { CreateTextDtoResponse } from '@guessir/shared/dist/CreateTextDtoResponse';
import { TextSkeleton } from '@guessir/shared/dist/game/types';
import urlJoin from 'url-join';

import { RemoteGame } from '../game/RemoteGame';
import { FetchHttpClient, HttpClient } from './HttpClient';

export class ApiClient {
  constructor(
    private readonly baseUrl = import.meta.env.GUESSIR_API_BASE_URL,
    private readonly httpClient: HttpClient = new FetchHttpClient(),
  ) {}

  async createText(payload: CreateTextDto): Promise<CreateTextDtoResponse> {
    return this.httpClient.post(urlJoin(this.baseUrl, `texts`), payload) as Promise<CreateTextDtoResponse>;
  }

  /** Loads the skeleton of the stored text with `id` and returns the game that plays it through the server. */
  async loadGame(id: string): Promise<RemoteGame> {
    // The id comes from the page URL, so it is encoded to stay one path segment
    const textUrl = urlJoin(this.baseUrl, 'texts', encodeURIComponent(id));
    const skeleton = (await this.httpClient.get(textUrl)) as TextSkeleton;

    return new RemoteGame({ httpClient: this.httpClient, textUrl, skeleton });
  }
}

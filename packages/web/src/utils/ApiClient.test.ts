import { TextSkeleton } from '@guessir/shared/dist/game/types';
import { beforeEach, describe, expect, it } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';

import { ApiClient } from './ApiClient';
import { HttpClient } from './HttpClient';

const skeleton: TextSkeleton = {
  title: 'Title',
  allowShowingFirstLetters: true,
  allowShowingText: true,
  wordCount: 1,
  lexemes: [{ index: 0, length: 3 }],
};
let httpClient: MockProxy<HttpClient>;
let apiClient: ApiClient;

describe(ApiClient, () => {
  beforeEach(() => {
    httpClient = mock<HttpClient>();
    apiClient = new ApiClient('https://api.test/', httpClient);
  });

  it('should create a text', async () => {
    const payload = { title: 'Title', text: 'One', allowShowingFirstLetters: true, allowShowingText: true };

    httpClient.post.mockResolvedValue({ id: 'text-id' });

    await expect(apiClient.createText(payload)).resolves.toEqual({ id: 'text-id' });
    expect(httpClient.post).toBeCalledWith('https://api.test/texts', payload);
  });

  it('should load the skeleton and play the game at the same text URL', async () => {
    httpClient.get.mockResolvedValue(skeleton);
    httpClient.post.mockResolvedValue({ words: [] });

    const game = await apiClient.loadGame('text-id');
    await game.guess('one');

    expect(game.skeleton).toEqual(skeleton);
    expect(httpClient.get).toBeCalledWith('https://api.test/texts/text-id');
    expect(httpClient.post).toBeCalledWith('https://api.test/texts/text-id/guesses', { word: 'one' });
  });

  it('should keep an id from the page URL to one path segment', async () => {
    httpClient.get.mockResolvedValue(skeleton);

    await apiClient.loadGame('../admin?x#y');

    expect(httpClient.get).toBeCalledWith('https://api.test/texts/..%2Fadmin%3Fx%23y');
  });
});

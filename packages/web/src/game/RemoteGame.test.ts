import { TextSkeleton } from '@guessir/shared/dist/game/types';
import { beforeEach, describe, expect, it } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';

import { HttpClient } from '../utils/HttpClient';
import { RemoteGame } from './RemoteGame';

const textUrl = 'https://api.test/texts/text-id';
const skeleton: TextSkeleton = {
  title: 'Title',
  allowShowingFirstLetters: true,
  allowShowingText: true,
  wordCount: 1,
  lexemes: [{ index: 0, length: 3 }],
};
const words = [{ index: 0, word: 'One' }];
let httpClient: MockProxy<HttpClient>;
let remoteGame: RemoteGame;

describe(RemoteGame, () => {
  beforeEach(() => {
    httpClient = mock<HttpClient>();
    remoteGame = new RemoteGame({ httpClient, textUrl, skeleton });
  });

  it('should keep the skeleton', () => {
    expect(remoteGame.skeleton).toBe(skeleton);
  });

  it('should ask the server about a guess', async () => {
    httpClient.post.mockResolvedValue({ words });

    await expect(remoteGame.guess('one')).resolves.toEqual(words);
    expect(httpClient.post).toBeCalledWith(`${textUrl}/guesses`, { word: 'one' });
  });

  it('should ask the server to reveal a word', async () => {
    httpClient.post.mockResolvedValue(words[0]);

    await expect(remoteGame.reveal(0)).resolves.toEqual(words[0]);
    expect(httpClient.post).toBeCalledWith(`${textUrl}/reveals`, { index: 0 });
  });

  it('should ask the server for the first letters', async () => {
    httpClient.get.mockResolvedValue({ words });

    await expect(remoteGame.firstLetters()).resolves.toEqual(words);
    expect(httpClient.get).toBeCalledWith(`${textUrl}/first-letters`);
  });

  it('should ask the server for the words', async () => {
    httpClient.get.mockResolvedValue({ words });

    await expect(remoteGame.words()).resolves.toEqual(words);
    expect(httpClient.get).toBeCalledWith(`${textUrl}/words`);
  });
});

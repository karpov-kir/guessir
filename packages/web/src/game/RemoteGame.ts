import { RevealedWord, RevealedWords, TextSkeleton } from '@guessir/shared/dist/game/types';
import urlJoin from 'url-join';

import { HttpClient } from '../utils/HttpClient';
import { Game } from './Game';

/** Plays a stored text, asking the server for every word a move opens. */
export class RemoteGame implements Game {
  public readonly skeleton: TextSkeleton;
  private readonly httpClient: HttpClient;
  private readonly textUrl: string;

  constructor(options: { httpClient: HttpClient; textUrl: string; skeleton: TextSkeleton }) {
    this.httpClient = options.httpClient;
    this.textUrl = options.textUrl;
    this.skeleton = options.skeleton;
  }

  async guess(word: string): Promise<RevealedWord[]> {
    return this.readWords(this.httpClient.post(urlJoin(this.textUrl, 'guesses'), { word }));
  }

  async reveal(index: number): Promise<RevealedWord> {
    return (await this.httpClient.post(urlJoin(this.textUrl, 'reveals'), { index })) as RevealedWord;
  }

  async firstLetters(): Promise<RevealedWord[]> {
    return this.readWords(this.httpClient.get(urlJoin(this.textUrl, 'first-letters')));
  }

  async words(): Promise<RevealedWord[]> {
    return this.readWords(this.httpClient.get(urlJoin(this.textUrl, 'words')));
  }

  private async readWords(response: Promise<unknown>): Promise<RevealedWord[]> {
    const { words } = (await response) as RevealedWords;

    return words;
  }
}

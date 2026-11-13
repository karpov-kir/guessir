import { RevealedWord, revealedWordSchema, revealedWordsSchema, TextSkeleton } from "@guessir/game";
import urlJoin from "url-join";

import { HttpClient } from "../utils/HttpClient";
import { Game } from "./Game";

/** Plays a stored text, asking the server for every word a move opens. */
export class RemoteGame implements Game {
  public readonly skeleton: TextSkeleton;
  private readonly httpClient: HttpClient;
  private readonly textPath: string;

  constructor(options: { httpClient: HttpClient; textPath: string; skeleton: TextSkeleton }) {
    this.httpClient = options.httpClient;
    this.textPath = options.textPath;
    this.skeleton = options.skeleton;
  }

  async guess(word: string): Promise<RevealedWord[]> {
    const { words } = await this.httpClient.post(
      urlJoin(this.textPath, "guesses"),
      { word },
      revealedWordsSchema,
    );

    return words;
  }

  async reveal(index: number): Promise<RevealedWord> {
    return this.httpClient.post(urlJoin(this.textPath, "reveals"), { index }, revealedWordSchema);
  }

  async firstLetters(): Promise<RevealedWord[]> {
    return this.readWords("first-letters");
  }

  async words(): Promise<RevealedWord[]> {
    return this.readWords("words");
  }

  private async readWords(route: string): Promise<RevealedWord[]> {
    const { words } = await this.httpClient.get(urlJoin(this.textPath, route), revealedWordsSchema);

    return words;
  }
}

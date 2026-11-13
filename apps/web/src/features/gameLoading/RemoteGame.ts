import { RevealedWord, revealedWordSchema, revealedWordsSchema, TextSkeleton } from "@guessir/game";
import urlJoin from "url-join";

import { GameApi } from "./GameApi";
import { Game } from "../../entities/game/exports";

/** Plays a stored text, asking the server for every word a move opens. */
export class RemoteGame implements Game {
  public readonly skeleton: TextSkeleton;
  private readonly api: GameApi;
  private readonly textPath: string;
  private readonly wordReads = new Map<string, Promise<RevealedWord[]>>();

  constructor(options: { api: GameApi; textPath: string; skeleton: TextSkeleton }) {
    this.api = options.api;
    this.textPath = options.textPath;
    this.skeleton = options.skeleton;
  }

  async guess(word: string): Promise<RevealedWord[]> {
    const { words } = await this.api.post(
      urlJoin(this.textPath, "guesses"),
      { word },
      revealedWordsSchema,
    );

    return words;
  }

  async reveal(index: number): Promise<RevealedWord> {
    return this.api.post(urlJoin(this.textPath, "reveals"), { index }, revealedWordSchema);
  }

  async firstLetters(): Promise<RevealedWord[]> {
    return this.readWords("first-letters");
  }

  async words(): Promise<RevealedWord[]> {
    return this.readWords("words");
  }

  /**
   * Asks the server for the words at `route` once and answers every later call from that read. The
   * server answers the same words for a text every time. A failed read is dropped, so the next
   * call asks again.
   */
  private readWords(route: string): Promise<RevealedWord[]> {
    let read = this.wordReads.get(route);

    if (!read) {
      read = this.api.get(urlJoin(this.textPath, route), revealedWordsSchema).then(
        ({ words }) => words,
        (error: unknown) => {
          this.wordReads.delete(route);
          throw error;
        },
      );
      this.wordReads.set(route, read);
    }

    return read;
  }
}

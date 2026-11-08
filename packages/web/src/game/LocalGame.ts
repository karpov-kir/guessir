import { CreateTextDto } from '@guessir/shared/dist/CreateTextDto';
import { TextGame } from '@guessir/shared/dist/game/TextGame';
import { RevealedWord, TextSkeleton } from '@guessir/shared/dist/game/types';

import { Game } from './Game';

/** Plays a text the page ships with, such as the welcome text, without the server. */
export class LocalGame implements Game {
  public readonly skeleton: TextSkeleton;
  private readonly textGame: TextGame;

  constructor({ text, ...details }: CreateTextDto) {
    this.textGame = new TextGame(text);
    this.skeleton = { ...details, wordCount: this.textGame.wordCount, lexemes: this.textGame.lexemes() };
  }

  async guess(word: string): Promise<RevealedWord[]> {
    return this.textGame.guess(word);
  }

  async reveal(index: number): Promise<RevealedWord> {
    const revealedWord = this.textGame.reveal(index);

    if (!revealedWord) {
      throw new Error(`No word at index ${index}`);
    }

    return revealedWord;
  }

  async firstLetters(): Promise<RevealedWord[]> {
    return this.textGame.firstLetters();
  }

  async words(): Promise<RevealedWord[]> {
    return this.textGame.words();
  }
}

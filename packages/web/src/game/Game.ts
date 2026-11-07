import { RevealedWord, TextSkeleton } from '@guessir/shared/dist/game/types';

/** A text to guess. The game gives only the skeleton up front, and each word comes back from a method call. */
export interface Game {
  readonly skeleton: TextSkeleton;
  /** Returns every word the guess matches, or an empty array for a miss. */
  guess(word: string): Promise<RevealedWord[]>;
  reveal(index: number): Promise<RevealedWord>;
  firstLetters(): Promise<RevealedWord[]>;
  words(): Promise<RevealedWord[]>;
}

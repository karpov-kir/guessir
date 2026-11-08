/** A word-like lexeme gives only its length, so the text stays on the server until the player opens a word. */
export type SkeletonLexeme = { index: number; length: number } | { index: number; character: string };

export type RevealedWord = { index: number; word: string };

export type RevealedWords = { words: RevealedWord[] };

export type TextSkeleton = {
  title: string;
  description?: string;
  allowShowingFirstLetters: boolean;
  allowShowingText: boolean;
  wordCount: number;
  lexemes: SkeletonLexeme[];
};

/**
 * Means one lexeme of the text skeleton: a word with only its length, or another lexeme with its
 * character. The server sends no word text here, so a player cannot read the hidden words in the
 * browser.
 */
export type SkeletonLexeme =
  | { index: number; length: number }
  | { index: number; character: string };

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

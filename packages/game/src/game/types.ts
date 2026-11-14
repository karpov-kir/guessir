import { z } from "zod";

import { codePointString } from "../strings.js";

const index = z.number().int().nonnegative();

/**
 * Means one lexeme of the text skeleton: a word with only its length, or another lexeme with its
 * character. The server sends no word text here, so a player cannot read the hidden words in the
 * browser.
 */
export const skeletonLexemeSchema = z.union([
  z.object({ index, length: z.number().int().positive() }),
  z.object({ index, character: z.string() }),
]);

/** Holds the body of a guess request: the word a player tries. */
export const guessDtoSchema = z.strictObject({ word: codePointString(100).min(1) });

/** Holds the body of a reveal request: the index of the word a player opens. */
export const revealDtoSchema = z.strictObject({ index });

export const revealedWordSchema = z.object({ index, word: z.string() });

export const revealedWordsSchema = z.object({ words: z.array(revealedWordSchema) });

export const textSkeletonSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  allowShowingFirstLetters: z.boolean(),
  allowShowingText: z.boolean(),
  wordCount: z.number().int().nonnegative(),
  lexemes: z.array(skeletonLexemeSchema),
});

export type GuessDto = z.output<typeof guessDtoSchema>;
export type RevealDto = z.output<typeof revealDtoSchema>;
export type SkeletonLexeme = z.output<typeof skeletonLexemeSchema>;
export type RevealedWord = z.output<typeof revealedWordSchema>;
export type RevealedWords = z.output<typeof revealedWordsSchema>;
export type TextSkeleton = z.output<typeof textSkeletonSchema>;

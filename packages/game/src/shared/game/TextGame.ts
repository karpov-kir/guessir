import {
  analyze,
  isLexemeOtherCharacter,
  type LexemeAnalysis,
} from "#src/shared/lexemeAnalyzer/exports.js";
import { RevealedWord, SkeletonLexeme } from "./types.js";

/** Holds the raw text a game is played over, which the game trims and normalizes itself. */
type TextGameOptions = { text: string };

/**
 * Answers the moves of a word guessing game over one text, giving out only the words a move opens.
 */
export class TextGame {
  public readonly wordCount: number;
  private readonly lexemesByIndex: LexemeAnalysis["lexemes"];
  private readonly lexemesByWordLike: LexemeAnalysis["lexemesByWordLike"];

  constructor({ text }: TextGameOptions) {
    const lexemeAnalysis = analyze(text);

    this.wordCount = lexemeAnalysis.wordLikeCount;
    this.lexemesByIndex = lexemeAnalysis.lexemes;
    this.lexemesByWordLike = lexemeAnalysis.lexemesByWordLike;
  }

  /**
   * Returns the text skeleton: each non-word lexeme with its character, and each word with only its
   * length.
   */
  public lexemes(): SkeletonLexeme[] {
    return Array.from(this.lexemesByIndex, ([index, lexeme]) =>
      isLexemeOtherCharacter(lexeme)
        ? { index, character: lexeme.normalized }
        : { index, length: lexeme.normalized.length },
    );
  }

  /**
   * Returns every word that matches the guess, ignoring case and surrounding spaces, or an empty
   * array for a miss. The guess is composed (NFC), as the text is.
   */
  public guess(word: string): RevealedWord[] {
    const lexemes = this.lexemesByWordLike.get(word.normalize("NFC").trim().toLowerCase()) ?? [];

    return Array.from(lexemes, ([index, lexeme]) => ({ index, word: lexeme.normalized }));
  }

  /**
   * Returns the word at `index`, or undefined when there is no lexeme at `index` or that lexeme is
   * not a word.
   */
  public reveal(index: number): RevealedWord | undefined {
    const lexeme = this.lexemesByIndex.get(index);

    if (!lexeme || isLexemeOtherCharacter(lexeme)) {
      return undefined;
    }

    return { index, word: lexeme.normalized };
  }

  /** Returns every word cut to its first character. */
  public firstLetters(): RevealedWord[] {
    return this.words().map(({ index, word }) => ({ index, word: word[0] }));
  }

  /** Returns every word of the text with its index, so it gives away the whole answer. */
  public words(): RevealedWord[] {
    return Array.from(this.lexemesByIndex)
      .filter(([, lexeme]) => !isLexemeOtherCharacter(lexeme))
      .map(([index, lexeme]) => ({ index, word: lexeme.normalized }));
  }
}

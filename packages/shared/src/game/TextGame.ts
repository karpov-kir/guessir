import { LexemeAnalyzer } from '../lexemeAnalyzer/LexemeAnalyzer';
import { LexemeNormalizer } from '../lexemeAnalyzer/LexemeNormalizer';
import { LexemeAnalysis } from '../lexemeAnalyzer/types';
import { RevealedWord, SkeletonLexeme } from './types';

/** Answers the moves of a word guessing game over one text, giving out only the words a move opens. */
export class TextGame {
  public readonly wordCount: number;
  private readonly lexemesByIndex: LexemeAnalysis['lexemes'];
  private readonly lexemesByWordLike: LexemeAnalysis['lexemesByWordLike'];

  constructor(text: string) {
    const lexemeAnalysis = LexemeAnalyzer.analyze(text);

    this.wordCount = lexemeAnalysis.wordLikeCount;
    this.lexemesByIndex = lexemeAnalysis.lexemes;
    this.lexemesByWordLike = lexemeAnalysis.lexemesByWordLike;
  }

  /** Returns the text skeleton: each non-word lexeme with its character, and each word with only its length. */
  public lexemes(): SkeletonLexeme[] {
    return Array.from(this.lexemesByIndex, ([index, lexeme]) =>
      LexemeNormalizer.isLexemeOtherCharacter(lexeme)
        ? { index, character: lexeme.normalized }
        : { index, length: lexeme.normalized.length },
    );
  }

  /** Returns every word that matches the guess, ignoring case and surrounding spaces, or an empty array for a miss. */
  public guess(word: string): RevealedWord[] {
    const lexemes = this.lexemesByWordLike.get(word.trim().toLowerCase()) ?? [];

    return Array.from(lexemes, ([index, lexeme]) => ({ index, word: lexeme.normalized }));
  }

  /** Returns the word at `index`, or undefined when the lexeme there is not a word. */
  public reveal(index: number): RevealedWord | undefined {
    const lexeme = this.lexemesByIndex.get(index);

    if (!lexeme || LexemeNormalizer.isLexemeOtherCharacter(lexeme)) {
      return undefined;
    }

    return { index, word: lexeme.normalized };
  }

  /** Returns every word cut to its first character. */
  public firstLetters(): RevealedWord[] {
    return this.words().map(({ index, word }) => ({ index, word: word[0] }));
  }

  public words(): RevealedWord[] {
    return Array.from(this.lexemesByIndex)
      .filter(([, lexeme]) => !LexemeNormalizer.isLexemeOtherCharacter(lexeme))
      .map(([index, lexeme]) => ({ index, word: lexeme.normalized }));
  }
}

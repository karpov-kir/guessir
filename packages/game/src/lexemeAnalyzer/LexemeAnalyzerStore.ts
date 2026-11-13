import * as LexemeNormalizer from "./LexemeNormalizer.js";
import { GroupWordLikeNominal, Lexeme, LexemeAnalysis } from "./types.js";

export class LexemeAnalyzerStore implements LexemeAnalysis {
  #lexemes: Map<number, Lexeme> = new Map<number, Lexeme>();
  public get lexemes() {
    return new Map(this.#lexemes);
  }

  /**
   * Returns the lexeme at `index` without copying the lexemes, or undefined where there is none.
   */
  public getLexeme(index: number) {
    return this.#lexemes.get(index);
  }

  #lexemesByWordLike: Map<GroupWordLikeNominal, Map<number, Lexeme>> = new Map<
    GroupWordLikeNominal,
    Map<number, Lexeme>
  >();
  public get lexemesByWordLike() {
    return new Map(this.#lexemesByWordLike);
  }

  #wordLikeCount = 0;
  public get wordLikeCount() {
    return this.#wordLikeCount;
  }

  #otherCharacterCount = 0;
  public get otherCharacterCount() {
    return this.#otherCharacterCount;
  }

  #lastLexemeIndex = -1;
  public get lastLexemeIndex() {
    return this.#lastLexemeIndex;
  }

  public addLexeme(newLexeme: Lexeme) {
    const newLexemeIndex = ++this.#lastLexemeIndex;
    this.#lexemes.set(newLexemeIndex, newLexeme);

    if (LexemeNormalizer.isLexemeOtherCharacter(newLexeme)) {
      this.#otherCharacterCount++;
    } else {
      this.#wordLikeCount++;

      LexemeNormalizer.getGroupingWords(newLexeme.normalized).forEach((groupWordLikeNominal) => {
        const lexemesByWordLike =
          this.#lexemesByWordLike.get(groupWordLikeNominal) || new Map<number, Lexeme>();
        lexemesByWordLike.set(newLexemeIndex, newLexeme);
        this.#lexemesByWordLike.set(groupWordLikeNominal, lexemesByWordLike);
      });
    }
  }

  /**
   * Deletes lexemes from the end while `filter` returns true for each, and stops at the first it
   * rejects.
   */
  public deleteLastLexemesUntilMatch(filter: (lexeme: Lexeme) => boolean) {
    let lastLexeme = this.#lexemes.get(this.lastLexemeIndex);

    while (lastLexeme && filter(lastLexeme)) {
      if (LexemeNormalizer.isLexemeOtherCharacter(lastLexeme)) {
        this.#otherCharacterCount--;
      } else {
        this.#wordLikeCount--;

        LexemeNormalizer.getGroupingWords(lastLexeme.normalized).forEach((groupWordLikeNominal) => {
          const lexemesByWordLike =
            this.#lexemesByWordLike.get(groupWordLikeNominal) || new Map<number, Lexeme>();

          lexemesByWordLike.delete(this.lastLexemeIndex);

          if (!lexemesByWordLike.size) {
            this.#lexemesByWordLike.delete(groupWordLikeNominal);
          }
        });
      }

      this.#lexemes.delete(this.lastLexemeIndex);
      this.#lastLexemeIndex--;
      lastLexeme = this.#lexemes.get(this.lastLexemeIndex);
    }

    return true;
  }

  public isLastNLexemesMatch(count: number, filter: (lexeme: Lexeme) => boolean) {
    let lexemeIndex = this.lastLexemeIndex;

    while (count > 0) {
      const lexeme = this.#lexemes.get(lexemeIndex);

      if (!lexeme || !filter(lexeme)) {
        return false;
      }

      lexemeIndex--;
      count--;
    }

    return true;
  }
}

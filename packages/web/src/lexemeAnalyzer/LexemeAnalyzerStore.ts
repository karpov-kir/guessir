import { LexemeNormalizer } from './LexemeNormalizer';
import { GroupWordLikeNominal, Lexeme, LexemeAnalysis } from './types';

export class LexemeAnalyzerStore implements LexemeAnalysis {
  public lexemes = new Map<number, Lexeme>();
  public lexemesByWordLike = new Map<GroupWordLikeNominal, Map<number, Lexeme>>();
  public wordLikeCount = 0;
  public otherCharacterCount = 0;
  public lastLexemeIndex = -1;

  public addLexeme(newLexeme: Lexeme) {
    const newLexemeIndex = ++this.lastLexemeIndex;
    this.lexemes.set(newLexemeIndex, newLexeme);

    if (LexemeNormalizer.isLexemeOtherCharacter(newLexeme)) {
      this.otherCharacterCount++;
    } else {
      this.wordLikeCount++;

      LexemeNormalizer.getGroupingWords(newLexeme.normalized).forEach((groupWordLikeNominal) => {
        const lexemesByWordLike = this.lexemesByWordLike.get(groupWordLikeNominal) || new Map<number, Lexeme>();
        lexemesByWordLike.set(newLexemeIndex, newLexeme);
        this.lexemesByWordLike.set(groupWordLikeNominal, lexemesByWordLike);
      });
    }
  }

  public deleteLastLexemesUntilMatch(filter: (lexeme: Lexeme) => boolean) {
    let lastLexeme = this.lexemes.get(this.lastLexemeIndex);

    while (lastLexeme && filter(lastLexeme)) {
      if (LexemeNormalizer.isLexemeOtherCharacter(lastLexeme)) {
        this.otherCharacterCount--;
      } else {
        this.wordLikeCount--;

        LexemeNormalizer.getGroupingWords(lastLexeme.normalized).forEach((groupWordLikeNominal) => {
          const lexemesByWordLike = this.lexemesByWordLike.get(groupWordLikeNominal) || new Map<number, Lexeme>();

          lexemesByWordLike.delete(this.lastLexemeIndex);

          if (!lexemesByWordLike.size) {
            this.lexemesByWordLike.delete(groupWordLikeNominal);
          }
        });
      }

      this.lexemes.delete(this.lastLexemeIndex);
      this.lastLexemeIndex--;
      lastLexeme = this.lexemes.get(this.lastLexemeIndex);
    }

    return true;
  }

  public isLastNLexemesMatch(count: number, filter: (lexeme: Lexeme) => boolean) {
    let lexemeIndex = this.lastLexemeIndex;

    while (count > 0) {
      const lexeme = this.lexemes.get(lexemeIndex);

      if (!lexeme || !filter(lexeme)) {
        return false;
      }

      lexemeIndex--;
      count--;
    }

    return true;
  }
}

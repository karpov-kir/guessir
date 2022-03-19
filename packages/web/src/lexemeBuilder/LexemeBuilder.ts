import { LexemeNormalizer } from './LexemeNormalizer';
import {
  GroupWordLikeNominal,
  Lexeme,
  LexemeAnalysis,
  LexemeType,
  NormalizedPrimitiveLexemeNominal,
  PrimitiveLexemeNominal,
} from './types';

export class LexemeBuilder {
  private lexemes = new Map<number, Lexeme>();
  private lexemesByWordLike = new Map<GroupWordLikeNominal, Map<number, Lexeme>>();
  private wordLikeCount = 0;
  private specialCharacterCount = 0;
  private lastLexemeIndex = -1;

  private static PUNCTUATION_CHARACTERS = [',', '.', '!', '?', ';'];

  public buildLexemes(rawText: string): LexemeAnalysis {
    const text = rawText.trim();
    let primitiveLexeme: PrimitiveLexemeNominal = '' as PrimitiveLexemeNominal;
    let normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal = '' as NormalizedPrimitiveLexemeNominal;
    let startIndex: number | undefined = undefined;
    let shouldProcessPrimitiveLexeme = false;

    for (let i = 0, l = text.length; i < l; i++) {
      const character = text[i];
      const normalizedCharacter = LexemeNormalizer.normalizeCharacter(character);

      if (startIndex === undefined) {
        startIndex = i;
      }

      if (LexemeNormalizer.isWordCharacter(normalizedCharacter)) {
        const nextNormalizedCharacter =
          // Can be undefined if this is beyond the text
          text[i + 1] === undefined ? undefined : LexemeNormalizer.normalizeCharacter(text[i + 1]);
        // If the next character is not a part of the word, then the word is finished
        const isWordBoundary =
          nextNormalizedCharacter === undefined || !LexemeNormalizer.isWordCharacter(nextNormalizedCharacter);

        // Cumulate this primitive lexeme till the end of the word
        primitiveLexeme = (primitiveLexeme + character) as PrimitiveLexemeNominal;
        normalizedPrimitiveLexeme = (normalizedPrimitiveLexeme +
          normalizedCharacter) as NormalizedPrimitiveLexemeNominal;
        shouldProcessPrimitiveLexeme = isWordBoundary;

        if (isWordBoundary) {
          normalizedPrimitiveLexeme = LexemeNormalizer.normalizeWord(primitiveLexeme, normalizedPrimitiveLexeme);
        }
      } else {
        primitiveLexeme = character as PrimitiveLexemeNominal;
        normalizedPrimitiveLexeme = normalizedCharacter;
        shouldProcessPrimitiveLexeme = true;
      }

      if (shouldProcessPrimitiveLexeme) {
        this.processPrimitiveLexeme(primitiveLexeme, normalizedPrimitiveLexeme, startIndex, i);
        startIndex = undefined;
        primitiveLexeme = '' as PrimitiveLexemeNominal;
        normalizedPrimitiveLexeme = '' as NormalizedPrimitiveLexemeNominal;
        shouldProcessPrimitiveLexeme = false;
      }
    }

    const lexemes = this.lexemes;
    const lexemesByWordLike = this.lexemesByWordLike;
    const wordLikeCount = this.wordLikeCount;
    const specialCharacterCount = this.specialCharacterCount;

    // Clean up
    this.lexemes = new Map<number, Lexeme>();
    this.lexemesByWordLike = new Map<GroupWordLikeNominal, Map<number, Lexeme>>();
    this.wordLikeCount = 0;
    this.specialCharacterCount = 0;
    this.lastLexemeIndex = -1;

    return {
      lexemes,
      lexemesByWordLike,
      wordLikeCount,
      specialCharacterCount,
    };
  }

  private processPrimitiveLexeme(
    primitiveLexeme: PrimitiveLexemeNominal,
    normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal,
    startIndex: number,
    endIndex: number,
  ) {
    const newBaseLexeme = {
      endIndex,
      startIndex: startIndex,
      original: primitiveLexeme,
      normalized: normalizedPrimitiveLexeme,
      uncontracted: LexemeNormalizer.uncontractPrimitiveLexeme(normalizedPrimitiveLexeme),
    };
    const newLexeme = {
      ...newBaseLexeme,
      type: LexemeNormalizer.getLexemeType(newBaseLexeme),
    };

    // Split constructions like `I'm/We'll/they've` to different lexemes
    if (newLexeme.uncontracted !== newLexeme.normalized) {
      this.splitToLexemes(newLexeme, startIndex, endIndex);
      return;
    }

    const isLastSpace = this.isLastLexemesMatch(1, (lexeme) => lexeme.normalized === ' ');
    const isCurrentPunctuation = LexemeBuilder.PUNCTUATION_CHARACTERS.includes(newLexeme.normalized);
    const isCurrentNewLine = newLexeme.normalized === '\n';

    if (
      // Replace trailing space followed by a punctuation with this punctuation
      (isLastSpace && isCurrentPunctuation) ||
      // Replace trailing space followed by a new line with this new line
      (isLastSpace && isCurrentNewLine)
    ) {
      this.deleteLastLexemes((lexeme) => lexeme.normalized === ' ');
    }

    if (this.canAddLexeme(newLexeme)) {
      const newLexemeIndex = ++this.lastLexemeIndex;
      this.lexemes.set(newLexemeIndex, newLexeme);

      if (newLexeme.type === LexemeType.SpecialCharacter) {
        this.specialCharacterCount++;
      } else {
        this.wordLikeCount++;

        LexemeNormalizer.getGroupingWords(newLexeme.normalized).forEach((GroupWordLikeNominal) => {
          const lexemesByWordLike = this.lexemesByWordLike.get(GroupWordLikeNominal) || new Map<number, Lexeme>();
          lexemesByWordLike.set(newLexemeIndex, newLexeme);
          this.lexemesByWordLike.set(GroupWordLikeNominal, lexemesByWordLike);
        });
      }
    }
  }

  private splitToLexemes(lexeme: Lexeme, startIndex: number, endIndex: number) {
    const newNormalizedPrimitiveLexemes = lexeme.uncontracted.split(' ') as NormalizedPrimitiveLexemeNominal[];

    newNormalizedPrimitiveLexemes.forEach((newNormalizedPrimitiveLexeme, index) => {
      this.processPrimitiveLexeme(
        lexeme.original,
        LexemeNormalizer.normalizeWord(lexeme.original, newNormalizedPrimitiveLexeme),
        startIndex,
        endIndex,
      );

      if (index < newNormalizedPrimitiveLexemes.length - 1) {
        this.processPrimitiveLexeme(
          ' ' as PrimitiveLexemeNominal,
          ' ' as NormalizedPrimitiveLexemeNominal,
          startIndex,
          endIndex,
        );
      }
    });
  }

  private canAddLexeme(newLexeme: Lexeme) {
    const lastLexeme = this.lexemes.get(this.lastLexemeIndex);
    const isVeryFirstLexeme = !lastLexeme;

    if (isVeryFirstLexeme) {
      // Allow the very first lexeme only if it's a word or a letter
      return newLexeme.type === LexemeType.Word || newLexeme.type === LexemeType.Letter;
    } else {
      // No more than two `\n` in a row
      if (newLexeme.normalized === '\n' && this.isLastLexemesMatch(2, (lexeme) => lexeme.normalized === '\n')) {
        return false;
      }

      // No more than one ` ` in a row
      if (newLexeme.normalized === ' ' && this.isLastLexemesMatch(1, (lexeme) => lexeme.normalized === ' ')) {
        return false;
      }
    }

    return true;
  }

  private isLastLexemesMatch(count: number, filter: (lexeme: Lexeme) => boolean) {
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

  private deleteLastLexemes(filter: (lexeme: Lexeme) => boolean) {
    let lexeme = this.lexemes.get(this.lastLexemeIndex);

    while (lexeme && filter(lexeme)) {
      if (lexeme.type === LexemeType.SpecialCharacter) {
        this.specialCharacterCount--;
      } else {
        this.wordLikeCount--;

        LexemeNormalizer.getGroupingWords(lexeme.normalized).forEach((GroupWordLikeNominal) => {
          const lexemes = this.lexemesByWordLike.get(GroupWordLikeNominal) || new Map<number, Lexeme>();
          lexemes.delete(this.lastLexemeIndex);

          if (!lexemes.size) {
            this.lexemesByWordLike.delete(GroupWordLikeNominal);
          }
        });
      }

      this.lexemes.delete(this.lastLexemeIndex);
      this.lastLexemeIndex--;
      lexeme = this.lexemes.get(this.lastLexemeIndex);
    }

    return true;
  }
}

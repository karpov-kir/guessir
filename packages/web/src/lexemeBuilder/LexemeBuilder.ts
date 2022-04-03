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

  // Should apply the following rules:
  // - No more than 2 new line characters in a row
  // - No more than 1 space
  // - Keep only the first letter upper case if this letter is upper case in the original word
  // - Split contractions (constructions like `I'm/We'll/they've`) to individual lexemes
  //   - Add an additional group for words that cannot be uncotracted (read more in `getGroupingWords`)
  // - Replace trailing spaces followed by a punctuation with just punctuation
  // - Replace trailing spaces followed by a new line with just new line
  // - Allow the very first lexeme only if it's a word or a letter
  public buildLexemes(rawText: string): LexemeAnalysis {
    const text = rawText.trim();
    let primitiveLexeme: PrimitiveLexemeNominal = '' as PrimitiveLexemeNominal;
    let normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal = '' as NormalizedPrimitiveLexemeNominal;
    let startIndex: number | undefined = undefined;

    for (let i = 0, l = text.length; i < l; i++) {
      let shouldProcessPrimitiveLexeme = false;
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
          normalizedPrimitiveLexeme = LexemeNormalizer.convertNormalizedPrimitiveLexeme(
            primitiveLexeme,
            normalizedPrimitiveLexeme,
          );
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
    options: { onCreated?: (lexeme: Lexeme) => void } = {},
  ) {
    const { onCreated } = options;
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
      // Replace trailing spaces followed by a punctuation with just punctuation
      (isLastSpace && isCurrentPunctuation) ||
      // Replace trailing spaces followed by a new line with just new line
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

        LexemeNormalizer.getGroupingWords(newLexeme.normalized).forEach((groupWordLikeNominal) => {
          const lexemesByWordLike = this.lexemesByWordLike.get(groupWordLikeNominal) || new Map<number, Lexeme>();
          lexemesByWordLike.set(newLexemeIndex, newLexeme);
          this.lexemesByWordLike.set(groupWordLikeNominal, lexemesByWordLike);
        });
      }

      if (onCreated) {
        onCreated(newLexeme);
      }
    }
  }

  private splitToLexemes(lexeme: Lexeme, startIndex: number, endIndex: number) {
    const newNormalizedPrimitiveLexemes = lexeme.uncontracted.split(' ') as NormalizedPrimitiveLexemeNominal[];
    const restoreOriginalUncotructedLexeme = (newLexeme: Lexeme) => (newLexeme.uncontracted = lexeme.uncontracted);

    newNormalizedPrimitiveLexemes.forEach((newNormalizedPrimitiveLexeme, index) => {
      this.processPrimitiveLexeme(
        lexeme.original,
        LexemeNormalizer.convertNormalizedPrimitiveLexeme(lexeme.original, newNormalizedPrimitiveLexeme),
        startIndex,
        endIndex,
        { onCreated: restoreOriginalUncotructedLexeme },
      );

      // Add spaces between uncontracted lexemes
      if (index < newNormalizedPrimitiveLexemes.length - 1) {
        this.processPrimitiveLexeme(
          ' ' as PrimitiveLexemeNominal,
          ' ' as NormalizedPrimitiveLexemeNominal,
          startIndex,
          endIndex,
          { onCreated: restoreOriginalUncotructedLexeme },
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

      // No more than one space in a row
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

        LexemeNormalizer.getGroupingWords(lexeme.normalized).forEach((groupWordLikeNominal) => {
          const lexemes = this.lexemesByWordLike.get(groupWordLikeNominal) || new Map<number, Lexeme>();
          lexemes.delete(this.lastLexemeIndex);

          if (!lexemes.size) {
            this.lexemesByWordLike.delete(groupWordLikeNominal);
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

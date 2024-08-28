import { LexemeAnalyzerStore } from './LexemeAnalyzerStore';
import { LexemeAnalyzerUtils } from './lexemeAnalyzerUtils';
import { LexemeNormalizer } from './LexemeNormalizer';
import { Lexeme, LexemeAnalysis, LexemeType, NormalizedPrimitiveLexemeNominal, PrimitiveLexemeNominal } from './types';

export class LexemeAnalyzer {
  private static PUNCTUATION_CHARACTERS = [',', '.', '!', '?', ';'];

  /**
   * Applies the following rules:
   *  - No more than 2 new line characters in a row
   *  - No more than 1 space
   *  - Keeps only the first letter upper case if this letter is upper case in the original word
   *  - Splits contractions (constructions like `I'm/We'll/they've`) to individual lexemes
   *  - Adds an additional group for words that cannot be uncotracted (read more in `getGroupingWords`)
   *  - Replaces trailing spaces followed by a punctuation with just punctuation
   *  - Replaces trailing spaces followed by a new line with just new line
   *  - Allows the very first lexeme only if it's a word or a letter
   *  - Replaces specific special characters with more appropriate ones (e.g. `—` with `-`), check `CHARACTERS_TO_NORMALIZED_CHARACTERS`
   *  - Replaces some words (e.g. `i` -> `I`), check `NORMALIZED_WORDS_TO_NORMALIZED_WORDS`
   *  - Treats word separation characters as a part of a word (e.g. `re-generate`)
   */
  public static analyze(rawText: string): LexemeAnalysis {
    const text = rawText.trim();
    const lexemeAnalyzerStore = new LexemeAnalyzerStore();
    let buffer = LexemeAnalyzerUtils.createEmptyBuffer();
    let startIndex = 0;

    function processPrimitiveLexeme(endIndex: number) {
      LexemeAnalyzer.processPrimitiveLexeme(
        lexemeAnalyzerStore,
        buffer.primitiveLexeme,
        buffer.normalizedPrimitiveLexeme,
        startIndex,
        endIndex,
      );
      buffer = LexemeAnalyzerUtils.createEmptyBuffer();
      startIndex = endIndex + 1;
    }

    for (let i = 0, l = text.length; i < l; i++) {
      const character = text[i];
      const nextCharacter = text[i + 1];
      const normalizedCharacter = LexemeNormalizer.normalizeCharacter(character);

      if (LexemeNormalizer.isWordCharacter(normalizedCharacter)) {
        const nextNormalizedCharacter =
          // Can be undefined if this is beyond the text
          nextCharacter === undefined ? undefined : LexemeNormalizer.normalizeCharacter(nextCharacter);
        const isWordBoundary =
          nextNormalizedCharacter === undefined || !LexemeNormalizer.isWordCharacter(nextNormalizedCharacter);

        LexemeAnalyzerUtils.addCharacterToBuffer(buffer, character, normalizedCharacter, isWordBoundary);

        // If the next character is not a part of the word, then the word is finished
        if (isWordBoundary) {
          processPrimitiveLexeme(i);
        }
      } else {
        LexemeAnalyzerUtils.setCharacterAsBuffer(buffer, character, normalizedCharacter);
        processPrimitiveLexeme(i);
      }
    }

    return {
      lexemes: lexemeAnalyzerStore.lexemes,
      lexemesByWordLike: lexemeAnalyzerStore.lexemesByWordLike,
      wordLikeCount: lexemeAnalyzerStore.wordLikeCount,
      otherCharacterCount: lexemeAnalyzerStore.otherCharacterCount,
    };
  }

  private static processPrimitiveLexeme(
    lexemeAnalyzerStore: LexemeAnalyzerStore,
    primitiveLexeme: PrimitiveLexemeNominal,
    normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal,
    startIndex: number,
    endIndex: number,
  ) {
    // It may be split into smaller lexemes. E.g. `I'm` to `I` and `am`.
    const possiblyNewLexeme = LexemeAnalyzerUtils.createLexeme(
      primitiveLexeme,
      normalizedPrimitiveLexeme,
      startIndex,
      endIndex,
    );

    let newLexemes = [possiblyNewLexeme];

    // Uncontraction is applied after normalization. Therefor if `uncontracted` is not equal `normalized` then
    // we need to split the new primitive uncontracted lexeme (e.g. `do not`) to separate lexemes (e.g. to `do` and `not).
    if (possiblyNewLexeme.uncontracted !== possiblyNewLexeme.normalized) {
      newLexemes = LexemeAnalyzerUtils.splitUncontractedLexeme(possiblyNewLexeme, startIndex, endIndex);
    }

    newLexemes.forEach((newLexeme) => {
      const isLastSpace = lexemeAnalyzerStore.isLastNLexemesMatch(1, (lexeme) => lexeme.normalized === ' ');
      const isCurrentPunctuation = LexemeAnalyzer.PUNCTUATION_CHARACTERS.includes(newLexeme.normalized);
      const isCurrentNewLine = newLexeme.normalized === '\n';

      if (
        // Replace trailing spaces followed by a punctuation with just punctuation
        (isLastSpace && isCurrentPunctuation) ||
        // Replace trailing spaces followed by a new line with just new line
        (isLastSpace && isCurrentNewLine)
      ) {
        lexemeAnalyzerStore.deleteLastLexemesUntilMatch((lexeme) => lexeme.normalized === ' ');
      }

      if (LexemeAnalyzer.canAddLexeme(lexemeAnalyzerStore, newLexeme)) {
        lexemeAnalyzerStore.addLexeme(newLexeme);
      }
    });
  }

  private static canAddLexeme(lexemeAnalyzerStore: LexemeAnalyzerStore, lexemeToAdd: Lexeme) {
    const lastLexeme = lexemeAnalyzerStore.lexemes.get(lexemeAnalyzerStore.lastLexemeIndex);
    const isVeryFirstLexeme = !lastLexeme;

    if (isVeryFirstLexeme) {
      // Allow the very first lexeme only if it's a word or a letter
      return lexemeToAdd.type === LexemeType.Word || lexemeToAdd.type === LexemeType.Letter;
    }
    // No more than two `\n` in a row
    else if (
      lexemeToAdd.normalized === '\n' &&
      lexemeAnalyzerStore.isLastNLexemesMatch(2, (lexeme) => lexeme.normalized === '\n')
    ) {
      return false;
    }
    // No more than one space in a row
    else if (
      lexemeToAdd.normalized === ' ' &&
      lexemeAnalyzerStore.isLastNLexemesMatch(1, (lexeme) => lexeme.normalized === ' ')
    ) {
      return false;
    }

    return true;
  }
}

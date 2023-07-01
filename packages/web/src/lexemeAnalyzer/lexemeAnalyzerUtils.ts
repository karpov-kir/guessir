import { LexemeNormalizer } from './LexemeNormalizer';
import { Lexeme, NormalizedPrimitiveLexemeNominal, PrimitiveLexemeNominal } from './types';

interface Buffer {
  primitiveLexeme: PrimitiveLexemeNominal;
  normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal;
  startIndex?: number;
}

export class LexemeAnalyzerUtils {
  public static createEmptyBuffer(): Buffer {
    return {
      primitiveLexeme: '' as PrimitiveLexemeNominal,
      normalizedPrimitiveLexeme: '' as NormalizedPrimitiveLexemeNominal,
      startIndex: undefined,
    };
  }

  public static accumulateCharacterToWordInBuffer(
    buffer: Buffer,
    character: string,
    normalizedCharacter: NormalizedPrimitiveLexemeNominal,
    isWordBoundary: boolean,
  ) {
    // Cumulate this primitive lexeme till the end of the word
    buffer.primitiveLexeme = (buffer.primitiveLexeme + character) as PrimitiveLexemeNominal;
    buffer.normalizedPrimitiveLexeme = (buffer.normalizedPrimitiveLexeme +
      normalizedCharacter) as NormalizedPrimitiveLexemeNominal;

    if (isWordBoundary) {
      buffer.normalizedPrimitiveLexeme = LexemeNormalizer.convertNormalizedWord(
        buffer.primitiveLexeme,
        buffer.normalizedPrimitiveLexeme,
      );
    }
  }

  public static setCharacterAsBuffer(
    buffer: Buffer,
    character: string,
    normalizedCharacter: NormalizedPrimitiveLexemeNominal,
  ) {
    buffer.primitiveLexeme = character as PrimitiveLexemeNominal;
    buffer.normalizedPrimitiveLexeme = normalizedCharacter;
  }

  /**
   * Split constructions like 'I am / we will / they have' to separate lexemes e.g. to 'I' and 'am'
   */
  public static splitUncontractedLexeme(lexemeToSplit: Lexeme, startIndex: number, endIndex: number) {
    const newNormalizedPrimitiveLexemes = lexemeToSplit.uncontracted.split(' ') as NormalizedPrimitiveLexemeNominal[];

    const splitResult: Array<{
      original: PrimitiveLexemeNominal;
      normalized: NormalizedPrimitiveLexemeNominal;
      startIndex: number;
      endIndex: number;
    }> = [];

    newNormalizedPrimitiveLexemes.forEach((newNormalizedPrimitiveLexeme, newNormalizedPrimitiveLexemeIndex) => {
      splitResult.push({
        original: lexemeToSplit.original,
        normalized: LexemeNormalizer.convertNormalizedWord(lexemeToSplit.original, newNormalizedPrimitiveLexeme),
        startIndex,
        endIndex,
      });

      // Add spaces between uncontracted lexemes
      if (newNormalizedPrimitiveLexemeIndex < newNormalizedPrimitiveLexemes.length - 1) {
        splitResult.push({
          original: ' ' as PrimitiveLexemeNominal,
          normalized: ' ' as NormalizedPrimitiveLexemeNominal,
          startIndex,
          endIndex,
        });
      }
    });

    return splitResult;
  }
}

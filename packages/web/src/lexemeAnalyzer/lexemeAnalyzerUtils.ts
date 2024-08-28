import { LexemeNormalizer } from './LexemeNormalizer';
import { BaseLexeme, Lexeme, NormalizedPrimitiveLexemeNominal, PrimitiveLexemeNominal } from './types';

interface Buffer {
  primitiveLexeme: PrimitiveLexemeNominal;
  normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal;
}

export class LexemeAnalyzerUtils {
  public static createEmptyBuffer(): Buffer {
    return {
      primitiveLexeme: '' as PrimitiveLexemeNominal,
      normalizedPrimitiveLexeme: '' as NormalizedPrimitiveLexemeNominal,
    };
  }

  public static addCharacterToBuffer(
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
  public static splitUncontractedLexeme(lexemeToSplit: Lexeme, startIndex: number, endIndex: number): Lexeme[] {
    const newNormalizedPrimitiveLexemes = lexemeToSplit.uncontracted.split(' ') as NormalizedPrimitiveLexemeNominal[];
    const splitLexemes: Lexeme[] = [];

    newNormalizedPrimitiveLexemes.forEach((newNormalizedPrimitiveLexeme, newNormalizedPrimitiveLexemeIndex) => {
      splitLexemes.push(
        LexemeAnalyzerUtils.createLexeme(
          lexemeToSplit.original,
          LexemeNormalizer.convertNormalizedWord(lexemeToSplit.original, newNormalizedPrimitiveLexeme),
          startIndex,
          endIndex,
        ),
      );

      // Add spaces between uncontracted lexemes
      if (newNormalizedPrimitiveLexemeIndex < newNormalizedPrimitiveLexemes.length - 1) {
        splitLexemes.push(
          LexemeAnalyzerUtils.createLexeme(
            ' ' as PrimitiveLexemeNominal,
            ' ' as NormalizedPrimitiveLexemeNominal,
            startIndex,
            endIndex,
          ),
        );
      }
    });

    return splitLexemes.map((splitLexeme) => ({
      ...splitLexeme,
      // Because lexemes are split into separate ones (e.g. 'I am' to 'I' and 'am') we need to know the whole uncontracted (original)
      // lexeme in each new lexeme. Otherwise, each new lexeme would have the same `Lexeme.normalized` and `Lexeme.uncontracted`
      // fields. This overrides e.g. `am` in a new lexeme to `I am`.
      uncontracted: lexemeToSplit.uncontracted,
    }));
  }

  public static createLexeme(
    primitiveLexeme: PrimitiveLexemeNominal,
    normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal,
    startIndex: number,
    endIndex: number,
  ) {
    const newBaseLexeme: BaseLexeme = {
      endIndex,
      startIndex: startIndex,
      original: primitiveLexeme,
      normalized: normalizedPrimitiveLexeme,
      uncontracted: LexemeNormalizer.uncontractPrimitiveLexeme(normalizedPrimitiveLexeme),
    };
    const newLexeme: Lexeme = {
      ...newBaseLexeme,
      type: LexemeNormalizer.getLexemeType(newBaseLexeme),
    };

    return newLexeme;
  }
}

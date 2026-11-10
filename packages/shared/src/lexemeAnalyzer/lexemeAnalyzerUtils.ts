import { LexemeNormalizer } from "./LexemeNormalizer.js";
import {
  BaseLexeme,
  Lexeme,
  NormalizedPrimitiveLexemeNominal,
  PrimitiveLexemeNominal,
} from "./types.js";

interface Buffer {
  primitiveLexeme: PrimitiveLexemeNominal;
  normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal;
}

export class LexemeAnalyzerUtils {
  public static createEmptyBuffer(): Buffer {
    return {
      primitiveLexeme: "" as PrimitiveLexemeNominal,
      normalizedPrimitiveLexeme: "" as NormalizedPrimitiveLexemeNominal,
    };
  }

  public static addCharacterToBuffer(
    buffer: Buffer,
    character: string,
    normalizedCharacter: NormalizedPrimitiveLexemeNominal,
    isWordBoundary: boolean,
  ) {
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
   * Splits an uncontracted lexeme such as `I am` into one lexeme per word, with a space lexeme
   * between the words. Each word keeps the original text, and every part keeps the given indexes
   * and the whole uncontracted form.
   */
  public static splitUncontractedLexeme(
    lexemeToSplit: Lexeme,
    startIndex: number,
    endIndex: number,
  ): Lexeme[] {
    const newNormalizedPrimitiveLexemes = lexemeToSplit.uncontracted.split(
      " ",
    ) as NormalizedPrimitiveLexemeNominal[];
    const splitLexemes: Lexeme[] = [];

    newNormalizedPrimitiveLexemes.forEach(
      (newNormalizedPrimitiveLexeme, newNormalizedPrimitiveLexemeIndex) => {
        splitLexemes.push(
          LexemeAnalyzerUtils.createLexeme(
            lexemeToSplit.original,
            LexemeNormalizer.convertNormalizedWord(
              lexemeToSplit.original,
              newNormalizedPrimitiveLexeme,
            ),
            startIndex,
            endIndex,
          ),
        );

        if (newNormalizedPrimitiveLexemeIndex < newNormalizedPrimitiveLexemes.length - 1) {
          splitLexemes.push(
            LexemeAnalyzerUtils.createLexeme(
              " " as PrimitiveLexemeNominal,
              " " as NormalizedPrimitiveLexemeNominal,
              startIndex,
              endIndex,
            ),
          );
        }
      },
    );

    return splitLexemes.map((splitLexeme) => ({
      ...splitLexeme,
      // Each part gets the whole uncontracted form, such as `I am` for `am`. `createLexeme` gives
      // each part only its own word, the same value as its `normalized` field.
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

import * as LexemeNormalizer from "./LexemeNormalizer.js";
import {
  BaseLexeme,
  Lexeme,
  NormalizedPrimitiveLexemeNominal,
  PrimitiveLexemeNominal,
  asNormalized,
  asPrimitive,
} from "./types.js";

interface Buffer {
  primitiveLexeme: PrimitiveLexemeNominal;
  normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal;
}

export function createEmptyBuffer(): Buffer {
  return {
    primitiveLexeme: asPrimitive(""),
    normalizedPrimitiveLexeme: asNormalized(""),
  };
}

export function addCharacterToBuffer(
  buffer: Buffer,
  character: string,
  normalizedCharacter: NormalizedPrimitiveLexemeNominal,
  isWordBoundary: boolean,
) {
  buffer.primitiveLexeme = asPrimitive(buffer.primitiveLexeme + character);
  buffer.normalizedPrimitiveLexeme = asNormalized(
    buffer.normalizedPrimitiveLexeme + normalizedCharacter,
  );

  if (isWordBoundary) {
    buffer.normalizedPrimitiveLexeme = LexemeNormalizer.convertNormalizedWord(
      buffer.primitiveLexeme,
      buffer.normalizedPrimitiveLexeme,
    );
  }
}

export function setCharacterAsBuffer(
  buffer: Buffer,
  character: string,
  normalizedCharacter: NormalizedPrimitiveLexemeNominal,
) {
  buffer.primitiveLexeme = asPrimitive(character);
  buffer.normalizedPrimitiveLexeme = normalizedCharacter;
}

/**
 * Splits an uncontracted lexeme such as `I am` into one lexeme per word, with a space lexeme
 * between the words. Each word keeps the original text, and every part keeps the given indexes
 * and the whole uncontracted form.
 */
export function splitUncontractedLexeme(
  lexemeToSplit: Lexeme,
  startIndex: number,
  endIndex: number,
): Lexeme[] {
  const newNormalizedPrimitiveLexemes = lexemeToSplit.uncontracted.split(" ").map(asNormalized);
  const splitLexemes: Lexeme[] = [];

  newNormalizedPrimitiveLexemes.forEach(
    (newNormalizedPrimitiveLexeme, newNormalizedPrimitiveLexemeIndex) => {
      splitLexemes.push(
        createLexeme(
          lexemeToSplit.original,
          // Only the first word takes the case of the contraction, so "Needn't" reads "Need not"
          LexemeNormalizer.convertNormalizedWord(
            newNormalizedPrimitiveLexemeIndex === 0
              ? lexemeToSplit.original
              : newNormalizedPrimitiveLexeme,
            newNormalizedPrimitiveLexeme,
          ),
          startIndex,
          endIndex,
        ),
      );

      if (newNormalizedPrimitiveLexemeIndex < newNormalizedPrimitiveLexemes.length - 1) {
        splitLexemes.push(createLexeme(asPrimitive(" "), asNormalized(" "), startIndex, endIndex));
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

export function createLexeme(
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

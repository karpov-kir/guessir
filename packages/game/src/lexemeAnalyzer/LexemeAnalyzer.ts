import { LexemeAnalyzerStore } from "./LexemeAnalyzerStore.js";
import * as LexemeAnalyzerUtils from "./lexemeAnalyzerUtils.js";
import * as LexemeNormalizer from "./LexemeNormalizer.js";
import {
  Lexeme,
  LexemeAnalysis,
  LexemeType,
  NormalizedPrimitiveLexemeNominal,
  PrimitiveLexemeNominal,
} from "./types.js";

const PUNCTUATION_CHARACTERS = [",", ".", "!", "?", ";"];

/**
 * Splits the trimmed text into normalized lexemes, and a contraction such as `I'm` into its
 * words. Keeps at most one space and two new lines in a row, drops a space before punctuation or
 * a new line, and starts at a word or letter.
 */
export function analyze(rawText: string): LexemeAnalysis {
  const text = rawText.trim();
  const lexemeAnalyzerStore = new LexemeAnalyzerStore();
  let buffer = LexemeAnalyzerUtils.createEmptyBuffer();
  let startIndex = 0;

  function processPrimitiveLexeme(endIndex: number) {
    addPrimitiveLexeme(
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
        nextCharacter === undefined
          ? undefined
          : LexemeNormalizer.normalizeCharacter(nextCharacter);
      const isWordBoundary =
        nextNormalizedCharacter === undefined ||
        !LexemeNormalizer.isWordCharacter(nextNormalizedCharacter);

      LexemeAnalyzerUtils.addCharacterToBuffer(
        buffer,
        character,
        normalizedCharacter,
        isWordBoundary,
      );

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

function addPrimitiveLexeme(
  lexemeAnalyzerStore: LexemeAnalyzerStore,
  primitiveLexeme: PrimitiveLexemeNominal,
  normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal,
  startIndex: number,
  endIndex: number,
) {
  const possiblyNewLexeme = LexemeAnalyzerUtils.createLexeme(
    primitiveLexeme,
    normalizedPrimitiveLexeme,
    startIndex,
    endIndex,
  );

  let newLexemes = [possiblyNewLexeme];

  // `createLexeme` expands a contraction into `uncontracted`, such as `do not` for `don't`. This
  // split gives each word its own lexeme.
  if (possiblyNewLexeme.uncontracted !== possiblyNewLexeme.normalized) {
    newLexemes = LexemeAnalyzerUtils.splitUncontractedLexeme(
      possiblyNewLexeme,
      startIndex,
      endIndex,
    );
  }

  newLexemes.forEach((newLexeme) => {
    const isLastSpace = lexemeAnalyzerStore.isLastNLexemesMatch(
      1,
      (lexeme) => lexeme.normalized === " ",
    );
    const isCurrentPunctuation = PUNCTUATION_CHARACTERS.includes(newLexeme.normalized);
    const isCurrentNewLine = newLexeme.normalized === "\n";

    if ((isLastSpace && isCurrentPunctuation) || (isLastSpace && isCurrentNewLine)) {
      lexemeAnalyzerStore.deleteLastLexemesUntilMatch((lexeme) => lexeme.normalized === " ");
    }

    if (canAddLexeme(lexemeAnalyzerStore, newLexeme)) {
      lexemeAnalyzerStore.addLexeme(newLexeme);
    }
  });
}

function canAddLexeme(lexemeAnalyzerStore: LexemeAnalyzerStore, lexemeToAdd: Lexeme) {
  const lastLexeme = lexemeAnalyzerStore.getLexeme(lexemeAnalyzerStore.lastLexemeIndex);
  const isVeryFirstLexeme = !lastLexeme;

  if (isVeryFirstLexeme) {
    return lexemeToAdd.type === LexemeType.Word || lexemeToAdd.type === LexemeType.Letter;
  } else if (
    lexemeToAdd.normalized === "\n" &&
    lexemeAnalyzerStore.isLastNLexemesMatch(2, (lexeme) => lexeme.normalized === "\n")
  ) {
    return false;
  } else if (
    lexemeToAdd.normalized === " " &&
    lexemeAnalyzerStore.isLastNLexemesMatch(1, (lexeme) => lexeme.normalized === " ")
  ) {
    return false;
  }

  return true;
}

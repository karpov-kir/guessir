import {
  BaseLexeme,
  GroupWordLikeNominal,
  Lexeme,
  LexemeType,
  NormalizedPrimitiveLexemeNominal,
  PrimitiveLexemeNominal,
  asGroupWordLike,
  asNormalized,
} from "./types.js";

const CHARACTERS_TO_NORMALIZED_CHARACTERS = new Map([
  ["—", asNormalized("-")],
  ["’", asNormalized("'")],
  ["`", asNormalized("'")],
]);
const NORMALIZED_WORDS_TO_NORMALIZED_WORDS = new Map([[asNormalized("i"), asNormalized("I")]]);
const NORMALIZED_CONTRACTION_CHARACTERS = new Set([asNormalized("'")]);
const NORMALIZED_WORD_SEPARATION_CHARACTERS = new Set([asNormalized("-")]);
const LETTER_RE = /^[A-Za-z]$/;

const NORMALIZED_CONTRACTION_TO_NORMALIZED_NORMAL = new Map<
  string,
  NormalizedPrimitiveLexemeNominal
>(
  [
    ["don't", "do not"],
    ["doesn't", "does not"],
    ["didn't", "did not"],

    ["haven't", "have not"],
    ["hadn't", "had not"],

    ["shouldn't", "should not"],
    ["wouldn't", "would not"],
    ["couldn't", "could not"],
    ["mustn't", "must not"],
    ["can't", "cannot"],
    ["needn't", "need not"],

    ["won't", "will not"],

    ["i'm", "I am"],
    ["i've", "I have"],
    ["i'll", "I will"],

    ["she'll", "she will"],

    ["he'll", "he will"],

    ["we're", "we are"],
    ["we've", "we have"],
    ["we'll", "we will"],

    ["they're", "they are"],
    ["they've", "they have"],
    ["they'll", "they will"],

    // The table leaves out `'d` and `'s` contractions, such as I'd and he's. Each has more than one
    // expansion, so `getGroupingWords` handles them instead.
  ].map(([contraction, expansion]): [string, NormalizedPrimitiveLexemeNominal] => [
    contraction,
    asNormalized(expansion),
  ]),
);

/**
 * Returns `newNormalizedLexeme` with its first letter in upper case when `originalLexeme` starts
 * with that letter in upper case.
 */
export function syncCase(
  originalLexeme: PrimitiveLexemeNominal | NormalizedPrimitiveLexemeNominal,
  newNormalizedLexeme: NormalizedPrimitiveLexemeNominal,
) {
  if (
    !originalLexeme.startsWith(newNormalizedLexeme[0]) &&
    originalLexeme.startsWith(newNormalizedLexeme[0].toUpperCase())
  ) {
    newNormalizedLexeme = asNormalized(
      newNormalizedLexeme[0].toUpperCase() + newNormalizedLexeme.substring(1),
    );
  }

  return newNormalizedLexeme;
}

export function convertNormalizedWord(
  originalPrimitiveLexeme: PrimitiveLexemeNominal | NormalizedPrimitiveLexemeNominal,
  normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal,
): NormalizedPrimitiveLexemeNominal {
  const converted =
    NORMALIZED_WORDS_TO_NORMALIZED_WORDS.get(normalizedPrimitiveLexeme) ||
    normalizedPrimitiveLexeme;

  return syncCase(originalPrimitiveLexeme, converted);
}

export function normalizeCharacter(character: string) {
  const lowerCasedCharacter = toLowerCaseCharacter(character);

  return (
    CHARACTERS_TO_NORMALIZED_CHARACTERS.get(lowerCasedCharacter) ||
    asNormalized(lowerCasedCharacter)
  );
}

/**
 * Returns the lower case of `character`, or `character` unchanged when its lower case is longer
 * than one character, such as `İ`, whose lower case is `i̇`. `isWordCharacter` throws on more
 * than one character, so `İ` stays itself and becomes an other-character lexeme, and the analysis
 * goes on.
 */
function toLowerCaseCharacter(character: string) {
  const lowerCasedCharacter = character.toLowerCase();

  return lowerCasedCharacter.length === 1 ? lowerCasedCharacter : character;
}

export function uncontractPrimitiveLexeme(
  normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal,
) {
  const converted = NORMALIZED_CONTRACTION_TO_NORMALIZED_NORMAL.get(
    normalizedPrimitiveLexeme.toLowerCase(),
  );

  if (converted) {
    return syncCase(normalizedPrimitiveLexeme, converted);
  }

  return normalizedPrimitiveLexeme;
}

export function isWordCharacter(normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal) {
  if (normalizedPrimitiveLexeme.length !== 1) {
    throw new Error("Can be used only for characters");
  }

  return isLetter(normalizedPrimitiveLexeme) || isWordHelpingCharacter(normalizedPrimitiveLexeme);
}

export function isLetter(normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal) {
  return LETTER_RE.test(normalizedPrimitiveLexeme);
}

export function isWordHelpingCharacter(
  normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal,
) {
  return (
    NORMALIZED_CONTRACTION_CHARACTERS.has(normalizedPrimitiveLexeme) ||
    NORMALIZED_WORD_SEPARATION_CHARACTERS.has(normalizedPrimitiveLexeme)
  );
}

export function getLexemeType(baseLexeme: BaseLexeme) {
  if (baseLexeme.normalized.length === 1) {
    if (isWordHelpingCharacter(baseLexeme.normalized)) {
      return LexemeType.WordHelping;
    }

    if (isLetter(baseLexeme.normalized)) {
      return LexemeType.Letter;
    }

    return LexemeType.SpecialCharacter;
  }

  return LexemeType.Word;
}

/** Returns the lower-cased word, preceded by its base word when it ends in `'s` or `'d`. */
export function getGroupingWords(
  normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal,
): GroupWordLikeNominal[] {
  const length = normalizedPrimitiveLexeme.length;
  const groupWordLikeNominal = asGroupWordLike(normalizedPrimitiveLexeme.toLowerCase());

  // This check adds the base word of a word that ends in `'s` or `'d`. The ending can mean is or
  // has, would or had, so the uncontraction table cannot expand it. The check skips a bare `'s`,
  // which has no base word.
  if (
    length > 2 &&
    ["s", "d"].includes(groupWordLikeNominal[length - 1]) &&
    groupWordLikeNominal[length - 2] === "'"
  ) {
    return [asGroupWordLike(groupWordLikeNominal.slice(0, -2)), groupWordLikeNominal];
  }

  return [groupWordLikeNominal];
}

export function isLexemeOtherCharacter(lexeme: Lexeme) {
  return lexeme.type === LexemeType.SpecialCharacter || lexeme.type === LexemeType.WordHelping;
}

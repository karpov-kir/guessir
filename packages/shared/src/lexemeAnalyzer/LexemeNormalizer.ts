import {
  BaseLexeme,
  GroupWordLikeNominal,
  Lexeme,
  LexemeType,
  NormalizedPrimitiveLexemeNominal,
  PrimitiveLexemeNominal,
} from "./types.js";

export class LexemeNormalizer {
  private static readonly CHARACTERS_TO_NORMALIZED_CHARACTERS = new Map<
    string,
    NormalizedPrimitiveLexemeNominal
  >([
    ["—", "-"],
    ["’", "'"],
    ["`", "'"],
  ] as Array<[string, NormalizedPrimitiveLexemeNominal]>);
  private static readonly NORMALIZED_WORDS_TO_NORMALIZED_WORDS = new Map<
    NormalizedPrimitiveLexemeNominal,
    NormalizedPrimitiveLexemeNominal
  >([["i", "I"]] as Array<[NormalizedPrimitiveLexemeNominal, NormalizedPrimitiveLexemeNominal]>);
  private static readonly NORMALIZED_CONTRACTION_CHARACTERS = [
    "'",
  ] as NormalizedPrimitiveLexemeNominal[];
  private static readonly NORMALIZED_WORD_SEPARATION_CHARACTERS = [
    "-",
  ] as NormalizedPrimitiveLexemeNominal[];
  private static readonly LETTER_RE = /^[A-Za-z]$/;

  private static readonly NORMALIZED_CONTRACTION_TO_NORMALIZED_NORMAL = new Map<string, string>([
    ["don't", "do not"],
    ["doesn't", "does not"],
    ["didn't", "did not"],

    ["haven't", "have not"],
    ["hadn't", "had not"],

    ["shouldn't", "should"],
    ["wouldn't", "would not"],
    ["couldn't", "could not"],
    ["mustn't", "must not"],
    ["can't", "cannot"],
    ["needn't", "need not"],

    ["won't", "will not"],

    ["I'm", "I am"],
    ["I've", "I have"],
    ["I'll", "I will"],

    ["she'll", "she will"],

    ["he'll", "he will"],

    ["we're", "we are"],
    ["we've", "we have"],
    ["we'll", "we will"],

    ["they're", "they are"],
    ["they've", "they have"],
    ["they'll", "they will"],

    // The table leaves out `'d` and `'s` contractions, such as I'd and he's. Each has two
    // expansions, so `getGroupingWords` handles them instead.
  ]);

  /**
   * Returns `newNormalizedLexeme` with its first letter in upper case when `originalLexeme` starts
   * with that letter in upper case.
   */
  public static syncCase(
    originalLexeme: PrimitiveLexemeNominal | NormalizedPrimitiveLexemeNominal,
    newNormalizedLexeme: NormalizedPrimitiveLexemeNominal,
  ) {
    if (
      !originalLexeme.startsWith(newNormalizedLexeme[0]) &&
      originalLexeme.startsWith(newNormalizedLexeme[0].toUpperCase())
    ) {
      newNormalizedLexeme = (newNormalizedLexeme[0].toUpperCase() +
        newNormalizedLexeme.substring(1)) as NormalizedPrimitiveLexemeNominal;
    }

    return newNormalizedLexeme;
  }

  public static convertNormalizedWord(
    originalPrimitiveLexeme: PrimitiveLexemeNominal,
    normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal,
  ): NormalizedPrimitiveLexemeNominal {
    const converted =
      LexemeNormalizer.NORMALIZED_WORDS_TO_NORMALIZED_WORDS.get(normalizedPrimitiveLexeme) ||
      normalizedPrimitiveLexeme;

    return this.syncCase(originalPrimitiveLexeme, converted);
  }

  public static normalizeCharacter(character: string) {
    const lowerCasedCharacter = LexemeNormalizer.toLowerCaseCharacter(character);

    return (
      LexemeNormalizer.CHARACTERS_TO_NORMALIZED_CHARACTERS.get(lowerCasedCharacter) ||
      (lowerCasedCharacter as NormalizedPrimitiveLexemeNominal)
    );
  }

  /**
   * Returns the lower case of `character`, or `character` unchanged when its lower case is longer
   * than one character, such as `İ`, whose lower case is `i̇`. `isWordCharacter` throws on more
   * than one character, so `İ` stays itself and becomes an other-character lexeme, and the analysis
   * goes on.
   */
  private static toLowerCaseCharacter(character: string) {
    const lowerCasedCharacter = character.toLowerCase();

    return lowerCasedCharacter.length === 1 ? lowerCasedCharacter : character;
  }

  public static uncontractPrimitiveLexeme(
    normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal,
  ) {
    const converted = LexemeNormalizer.NORMALIZED_CONTRACTION_TO_NORMALIZED_NORMAL.get(
      normalizedPrimitiveLexeme.toLowerCase(),
    ) as NormalizedPrimitiveLexemeNominal;

    if (converted) {
      return this.syncCase(normalizedPrimitiveLexeme, converted);
    }

    return normalizedPrimitiveLexeme;
  }

  public static isWordCharacter(normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal) {
    if (normalizedPrimitiveLexeme.length !== 1) {
      throw new Error("Can be used only for characters");
    }

    return (
      LexemeNormalizer.isLetter(normalizedPrimitiveLexeme) ||
      LexemeNormalizer.isWordHelpingCharacter(normalizedPrimitiveLexeme)
    );
  }

  public static isLetter(normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal) {
    return LexemeNormalizer.LETTER_RE.test(normalizedPrimitiveLexeme);
  }

  public static isWordHelpingCharacter(
    normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal,
  ) {
    return (
      LexemeNormalizer.NORMALIZED_CONTRACTION_CHARACTERS.includes(normalizedPrimitiveLexeme) ||
      LexemeNormalizer.NORMALIZED_WORD_SEPARATION_CHARACTERS.includes(normalizedPrimitiveLexeme)
    );
  }

  public static getLexemeType(baseLexeme: BaseLexeme) {
    if (baseLexeme.normalized.length === 1) {
      if (LexemeNormalizer.isWordHelpingCharacter(baseLexeme.normalized)) {
        return LexemeType.WordHelping;
      }

      if (LexemeNormalizer.isLetter(baseLexeme.normalized)) {
        return LexemeType.Letter;
      }

      return LexemeType.SpecialCharacter;
    }

    return LexemeType.Word;
  }

  /** Returns the lower-cased word, preceded by its base word when it ends in `'s` or `'d`. */
  public static getGroupingWords(
    normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal,
  ): GroupWordLikeNominal[] {
    const length = normalizedPrimitiveLexeme.length;
    const groupWordLikeNominal = normalizedPrimitiveLexeme.toLowerCase() as GroupWordLikeNominal;

    // This check adds the base word of a word that ends in `'s` or `'d`. The ending can mean is or
    // has, would or had, so the uncontraction table cannot expand it. The check skips a bare `'s`,
    // which has no base word.
    if (
      length > 2 &&
      ["s", "d"].includes(groupWordLikeNominal[length - 1]) &&
      groupWordLikeNominal[length - 2] === "'"
    ) {
      return [groupWordLikeNominal.slice(0, -2) as GroupWordLikeNominal, groupWordLikeNominal];
    }

    return [groupWordLikeNominal];
  }

  public static isLexemeOtherCharacter(lexeme: Lexeme) {
    return lexeme.type === LexemeType.SpecialCharacter || lexeme.type === LexemeType.WordHelping;
  }
}

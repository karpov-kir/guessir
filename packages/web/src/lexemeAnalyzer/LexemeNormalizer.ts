import {
  BaseLexeme,
  GroupWordLikeNominal,
  Lexeme,
  LexemeType,
  NormalizedPrimitiveLexemeNominal,
  PrimitiveLexemeNominal,
} from './types';

export class LexemeNormalizer {
  private static CHARACTERS_TO_NORMALIZED_CHARACTERS = new Map<string, NormalizedPrimitiveLexemeNominal>([
    ['—', '-'],
    ['’', "'"],
    ['`', "'"],
  ] as Array<[string, NormalizedPrimitiveLexemeNominal]>);
  private static NORMALIZED_WORDS_TO_NORMALIZED_WORDS = new Map<
    NormalizedPrimitiveLexemeNominal,
    NormalizedPrimitiveLexemeNominal
  >([['i', 'I']] as Array<[NormalizedPrimitiveLexemeNominal, NormalizedPrimitiveLexemeNominal]>);
  private static NORMALIZED_CONTRACTION_CHARACTERS = ["'"] as NormalizedPrimitiveLexemeNominal[];
  private static NORMALIZED_WORD_SEPARATION_CHARACTERS = ['-'] as NormalizedPrimitiveLexemeNominal[];
  private static LETTER_RE = /^[A-Za-z]$/;

  private static NORMALIZED_CONTRACTION_TO_NORMALIZED_NORMAL = new Map<string, string>([
    ["don't", 'do not'],
    ["doesn't", 'does not'],
    ["didn't", 'did not'],

    ["haven't", 'have not'],
    ["hadn't", 'had not'],

    ["shouldn't", 'should'],
    ["wouldn't", 'would not'],
    ["couldn't", 'could not'],
    ["mustn't", 'must not'],
    ["can't", 'cannot'],
    ["needn't", 'need not'],

    ["won't", 'will not'],

    ["I'm", 'I am'],
    ["I've", 'I have'],
    ["I'll", 'I will'],

    ["she'll", 'she will'],

    ["he'll", 'he will'],

    ["we're", 'we are'],
    ["we've", 'we have'],
    ["we'll", 'we will'],

    ["they're", 'they are'],
    ["they've", 'they have'],
    ["they'll", 'they will'],

    // I'd, She'd, He'd, He's, She's covered in `getGroupingWords`, read more there.
  ]);

  // Convert word to the title case if the original word is started from a capital letter
  public static syncCase(
    originalLexeme: PrimitiveLexemeNominal | NormalizedPrimitiveLexemeNominal,
    newNormalizedLexeme: NormalizedPrimitiveLexemeNominal,
  ) {
    if (newNormalizedLexeme[0] !== originalLexeme[0] && newNormalizedLexeme[0].toUpperCase() === originalLexeme[0]) {
      newNormalizedLexeme = (newNormalizedLexeme[0].toUpperCase() +
        newNormalizedLexeme.substring(1)) as NormalizedPrimitiveLexemeNominal;
    }

    return newNormalizedLexeme;
  }

  public static convertNormalizedPrimitiveLexeme(
    originalPrimitiveLexeme: PrimitiveLexemeNominal,
    normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal,
  ) {
    const converted =
      LexemeNormalizer.NORMALIZED_WORDS_TO_NORMALIZED_WORDS.get(normalizedPrimitiveLexeme) || normalizedPrimitiveLexeme;

    return this.syncCase(originalPrimitiveLexeme, converted);
  }

  public static normalizeCharacter(character: string) {
    const lowerCasedCharacter = character.toLowerCase();

    return (
      LexemeNormalizer.CHARACTERS_TO_NORMALIZED_CHARACTERS.get(lowerCasedCharacter) ||
      (lowerCasedCharacter as NormalizedPrimitiveLexemeNominal)
    );
  }

  public static uncontractPrimitiveLexeme(normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal) {
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
      throw new Error('Can be used only for characters');
    }

    return (
      LexemeNormalizer.isLetter(normalizedPrimitiveLexeme) ||
      LexemeNormalizer.isWordHelpingCharacter(normalizedPrimitiveLexeme)
    );
  }

  public static isLetter(normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal) {
    return LexemeNormalizer.LETTER_RE.test(normalizedPrimitiveLexeme);
  }

  public static isWordHelpingCharacter(normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal) {
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

  // To workaround words like `Item's/I'd/She'd/He'd/He's/She's`. We cannot uncontract them, as they can be
  // uncontracted in multiple ways (e.g. she's - she is / she has or it can be a possessive ’s), so we can simply
  // let the user use just e.g. `she` and count it as `she's` and as `she`.
  public static getGroupingWords(normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal): GroupWordLikeNominal[] {
    const length = normalizedPrimitiveLexeme.length;
    // Keep as lower-cased for easy access
    const groupWordLikeNominal = normalizedPrimitiveLexeme.toLowerCase() as GroupWordLikeNominal;

    // Separate words that end with `'s, 'd`, e.g. `she's`
    if (['s', 'd'].includes(groupWordLikeNominal[length - 1]) && groupWordLikeNominal[length - 2] === "'") {
      return [groupWordLikeNominal.slice(0, -2) as GroupWordLikeNominal, groupWordLikeNominal];
    }

    return [groupWordLikeNominal];
  }

  public static isLexemeOtherCharacter(lexeme: Lexeme) {
    return lexeme.type === LexemeType.SpecialCharacter || lexeme.type === LexemeType.WordHelping;
  }
}

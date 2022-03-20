import {
  BaseLexeme,
  GroupWordLikeNominal,
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

  public static normalizeWord(
    primitiveLexeme: PrimitiveLexemeNominal,
    normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal,
  ) {
    let converted =
      LexemeNormalizer.NORMALIZED_WORDS_TO_NORMALIZED_WORDS.get(normalizedPrimitiveLexeme) || normalizedPrimitiveLexeme;

    // Convert word to the title case of the original word is started from a capital letter
    if (converted[0] !== primitiveLexeme[0] && converted[0].toUpperCase() === primitiveLexeme[0]) {
      converted = (converted[0].toUpperCase() + converted.substring(1)) as NormalizedPrimitiveLexemeNominal;
    }

    return converted;
  }

  public static normalizeCharacter(character: string) {
    const lowerCasedCharacter = character.toLowerCase();

    return (
      LexemeNormalizer.CHARACTERS_TO_NORMALIZED_CHARACTERS.get(lowerCasedCharacter) ||
      (lowerCasedCharacter as NormalizedPrimitiveLexemeNominal)
    );
  }

  public static uncontractPrimitiveLexeme(normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal) {
    return (LexemeNormalizer.NORMALIZED_CONTRACTION_TO_NORMALIZED_NORMAL.get(normalizedPrimitiveLexeme) ||
      normalizedPrimitiveLexeme) as NormalizedPrimitiveLexemeNominal;
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
  // uncontracted in multiple ways (e.g. she's - she is / she has), so we can simply
  // let the user to use just e.g. `she` and count it as `she's` and as `she`.
  public static getGroupingWords(normalizedPrimitiveLexeme: NormalizedPrimitiveLexemeNominal): GroupWordLikeNominal[] {
    const length = normalizedPrimitiveLexeme.length;
    // Keep as lower-cased for easy access
    const GroupWordLikeNominal = normalizedPrimitiveLexeme.toLowerCase() as GroupWordLikeNominal;

    // Separate words that end with `'s`, e.g. `
    if (GroupWordLikeNominal[length - 1] === 's' && GroupWordLikeNominal[length - 2] === "'") {
      return [GroupWordLikeNominal.slice(0, -2) as GroupWordLikeNominal, GroupWordLikeNominal];
    }

    return [GroupWordLikeNominal];
  }
}

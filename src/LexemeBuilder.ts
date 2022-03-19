type NormalizedPrimitiveLexeme = string & {
  __type: 'normalized';
};

type GroupWord = string & {
  __type: 'groupWord';
};

type PrimitiveLexeme = string & {
  __type: 'primitive';
};

export enum LexemeType {
  Word = 'w',
  SpecialCharacter = 'sc',
  Letter = 'l',
  // E.g. dash in `re-configured` or apostrophe in`don't`
  WordHelping = 'wh',
}

interface BaseLexeme {
  startIndex: number;
  endIndex: number;
  original: PrimitiveLexeme;
  normalized: NormalizedPrimitiveLexeme;
  uncontracted: NormalizedPrimitiveLexeme;
}

export interface LexemeAnalysis {
  lexemes: Map<
    // Lexeme index
    number,
    Lexeme
  >;
  lexemesByWordLike: Map<
    // Word
    string,
    Map<
      // Lexeme index
      number,
      Lexeme
    >
  >;
  wordLikeCount: number;
  specialCharacterCount: number;
}

export interface Lexeme extends BaseLexeme {
  type: LexemeType;
}

export class LexemeBuilder {
  private lexemes = new Map<number, Lexeme>();
  private lexemesByWordLike = new Map<GroupWord, Map<number, Lexeme>>();
  private wordLikeCount = 0;
  private specialCharacterCount = 0;
  private lastLexemeIndex = -1;

  private static PUNCTUATION_CHARACTERS = [',', '.', '!', '?'];

  public buildLexemes(rawText: string): LexemeAnalysis {
    const text = rawText.trim();
    let primitiveLexeme: PrimitiveLexeme = '' as PrimitiveLexeme;
    let normalizedPrimitiveLexeme: NormalizedPrimitiveLexeme = '' as NormalizedPrimitiveLexeme;
    let startIndex: number | undefined = undefined;
    let shouldProcessPrimitiveLexeme = false;

    for (let i = 0, l = text.length; i < l; i++) {
      const character = text[i];
      const normalizedCharacter = LexemeNormalizer.normalizeCharacter(character);

      if (startIndex === undefined) {
        startIndex = i;
      }

      if (LexemeNormalizer.isWordCharacter(normalizedCharacter)) {
        const nextNormalizedCharacter =
          // Can be undefined if this is beyond the text
          text[i + 1] === undefined ? undefined : LexemeNormalizer.normalizeCharacter(text[i + 1]);
        // If the next character is not a part of the word, then the word is finished
        const isWordBoundary =
          nextNormalizedCharacter === undefined || !LexemeNormalizer.isWordCharacter(nextNormalizedCharacter);

        // Cumulate this primitive lexeme till the end of the word
        primitiveLexeme = (primitiveLexeme + character) as PrimitiveLexeme;
        normalizedPrimitiveLexeme = (normalizedPrimitiveLexeme + normalizedCharacter) as NormalizedPrimitiveLexeme;
        shouldProcessPrimitiveLexeme = isWordBoundary;

        if (isWordBoundary) {
          normalizedPrimitiveLexeme = LexemeNormalizer.normalizeWord(primitiveLexeme, normalizedPrimitiveLexeme);
        }
      } else {
        primitiveLexeme = character as PrimitiveLexeme;
        normalizedPrimitiveLexeme = normalizedCharacter;
        shouldProcessPrimitiveLexeme = true;
      }

      if (shouldProcessPrimitiveLexeme) {
        this.processPrimitiveLexeme(primitiveLexeme, normalizedPrimitiveLexeme, startIndex, i);
        startIndex = undefined;
        primitiveLexeme = '' as PrimitiveLexeme;
        normalizedPrimitiveLexeme = '' as NormalizedPrimitiveLexeme;
        shouldProcessPrimitiveLexeme = false;
      }
    }

    const lexemes = this.lexemes;
    const lexemesByWordLike = this.lexemesByWordLike;
    const wordLikeCount = this.wordLikeCount;
    const specialCharacterCount = this.specialCharacterCount;

    // Clean up
    this.lexemes = new Map<number, Lexeme>();
    this.lexemesByWordLike = new Map<GroupWord, Map<number, Lexeme>>();
    this.wordLikeCount = 0;
    this.specialCharacterCount = 0;

    return {
      lexemes,
      lexemesByWordLike,
      wordLikeCount,
      specialCharacterCount,
    };
  }

  private processPrimitiveLexeme(
    primitiveLexeme: PrimitiveLexeme,
    normalizedPrimitiveLexeme: NormalizedPrimitiveLexeme,
    startIndex: number,
    endIndex: number,
  ) {
    const newBaseLexeme = {
      endIndex,
      startIndex: startIndex,
      original: primitiveLexeme,
      normalized: normalizedPrimitiveLexeme,
      uncontracted: LexemeNormalizer.uncontractPrimitiveLexeme(normalizedPrimitiveLexeme),
    };
    const newLexeme = {
      ...newBaseLexeme,
      type: LexemeNormalizer.getLexemeType(newBaseLexeme),
    };

    // Split constructions like `I'm/We'll/they've` to different lexemes
    if (newLexeme.uncontracted !== newLexeme.normalized) {
      this.splitToLexemes(newLexeme, startIndex, endIndex);
      return;
    }

    if (this.canAddLexeme(newLexeme)) {
      const isLastSpace = this.isLastLexemesMatch(1, (lexeme) => lexeme.normalized === ' ');
      const isCurrentPunctuation = LexemeBuilder.PUNCTUATION_CHARACTERS.includes(newLexeme.normalized);

      // Replace trailing space with punctuation
      if (isLastSpace && isCurrentPunctuation) {
        this.deleteLastLexemes((lexeme) => lexeme.normalized === ' ');
      }

      const newLexemeIndex = ++this.lastLexemeIndex;
      this.lexemes.set(newLexemeIndex, newLexeme);

      if (newLexeme.type === LexemeType.SpecialCharacter) {
        this.specialCharacterCount++;
      } else {
        this.wordLikeCount++;

        this.getGroupingWords(newLexeme.normalized).forEach((groupWord) => {
          const lexemesByWordLike = this.lexemesByWordLike.get(groupWord) || new Map<number, Lexeme>();
          lexemesByWordLike.set(newLexemeIndex, newLexeme);
          this.lexemesByWordLike.set(groupWord, lexemesByWordLike);
        });
      }
    }
  }

  private splitToLexemes(lexeme: Lexeme, startIndex: number, endIndex: number) {
    const newNormalizedPrimitiveLexemes = lexeme.uncontracted.split(' ') as NormalizedPrimitiveLexeme[];

    newNormalizedPrimitiveLexemes.forEach((newNormalizedPrimitiveLexeme, index) => {
      this.processPrimitiveLexeme(
        lexeme.original,
        LexemeNormalizer.normalizeWord(lexeme.original, newNormalizedPrimitiveLexeme),
        startIndex,
        endIndex,
      );

      if (index < newNormalizedPrimitiveLexemes.length - 1) {
        this.processPrimitiveLexeme(' ' as PrimitiveLexeme, ' ' as NormalizedPrimitiveLexeme, startIndex, endIndex);
      }
    });
  }

  private canAddLexeme(newLexeme: Lexeme) {
    const lastLexeme = this.lexemes.get(this.lastLexemeIndex);

    if (!lastLexeme) {
      // Allow the very first lexeme only if it's a word or a letter
      return newLexeme.type === LexemeType.Word || newLexeme.type === LexemeType.Letter;
    } else {
      // No more than two `/n` in a row
      if (newLexeme.original === '/n' && this.isLastLexemesMatch(2, (lexeme) => lexeme.original === '/n')) {
        return false;
      }

      // No more than one ` ` in a row
      if (newLexeme.original === ' ' && this.isLastLexemesMatch(1, (lexeme) => lexeme.original === ' ')) {
        return false;
      }
    }

    return true;
  }

  private isLastLexemesMatch(count: number, filter: (lexeme: Lexeme) => boolean) {
    let lexemeIndex = this.lastLexemeIndex;

    while (count > 0) {
      const lexeme = this.lexemes.get(lexemeIndex);

      if (!lexeme || !filter(lexeme)) {
        return false;
      }

      lexemeIndex--;
      count--;
    }

    return true;
  }

  private deleteLastLexemes(filter: (lexeme: Lexeme) => boolean) {
    let lexeme = this.lexemes.get(this.lastLexemeIndex);

    while (lexeme && filter(lexeme)) {
      if (lexeme.type === LexemeType.SpecialCharacter) {
        this.specialCharacterCount--;
      } else {
        this.wordLikeCount--;

        this.getGroupingWords(lexeme.normalized).forEach((groupWord) => {
          const lexemes = this.lexemesByWordLike.get(groupWord) || new Map<number, Lexeme>();
          lexemes.delete(this.lastLexemeIndex);

          if (!lexemes.size) {
            this.lexemesByWordLike.delete(groupWord);
          }
        });
      }

      this.lexemes.delete(this.lastLexemeIndex);
      this.lastLexemeIndex--;
      lexeme = this.lexemes.get(this.lastLexemeIndex);
    }

    return true;
  }

  // To workaround words like `Item's/I'd/She'd/He'd/He's/She's`. We cannot uncontract them, as they can be
  // uncontracted in multiple ways (e.g. she's - she is / she has), so we can simply
  // let the user to use just e.g. `she` and count it as `she's` and as `she`.
  private getGroupingWords(normalizedPrimitiveLexeme: NormalizedPrimitiveLexeme): GroupWord[] {
    const length = normalizedPrimitiveLexeme.length;
    // Keep as lower-cased for easy access
    const groupWord = normalizedPrimitiveLexeme.toLowerCase() as GroupWord;

    // Separate words that end with `'s`, e.g. `
    if (groupWord[length - 1] === 's' && groupWord[length - 2] === "'") {
      return [groupWord.slice(0, -2) as GroupWord, groupWord];
    }

    return [groupWord];
  }
}

class LexemeNormalizer {
  private static CHARACTERS_TO_NORMALIZED_CHARACTERS = new Map<string, NormalizedPrimitiveLexeme>([
    ['—', '-'],
    ['’', "'"],
    ['`', "'"],
  ] as Array<[string, NormalizedPrimitiveLexeme]>);
  private static NORMALIZED_WORDS_TO_NORMALIZED_WORDS = new Map<NormalizedPrimitiveLexeme, NormalizedPrimitiveLexeme>([
    ['i', 'I'],
  ] as Array<[NormalizedPrimitiveLexeme, NormalizedPrimitiveLexeme]>);
  private static NORMALIZED_CONTRACTION_CHARACTERS = ["'"] as NormalizedPrimitiveLexeme[];
  private static NORMALIZED_WORD_SEPARATION_CHARACTERS = ['-'] as NormalizedPrimitiveLexeme[];
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

  public static normalizeWord(primitiveLexeme: PrimitiveLexeme, normalizedPrimitiveLexeme: NormalizedPrimitiveLexeme) {
    let converted =
      LexemeNormalizer.NORMALIZED_WORDS_TO_NORMALIZED_WORDS.get(normalizedPrimitiveLexeme) || normalizedPrimitiveLexeme;

    // Convert word to the title case of the original word is started from a capital letter
    if (converted[0] !== primitiveLexeme[0] && converted[0].toUpperCase() === primitiveLexeme[0]) {
      converted = (converted[0].toUpperCase() + converted.substring(1)) as NormalizedPrimitiveLexeme;
    }

    return converted;
  }

  public static normalizeCharacter(character: string) {
    const lowerCasedCharacter = character.toLowerCase();

    return (
      LexemeNormalizer.CHARACTERS_TO_NORMALIZED_CHARACTERS.get(lowerCasedCharacter) ||
      (lowerCasedCharacter as NormalizedPrimitiveLexeme)
    );
  }

  public static uncontractPrimitiveLexeme(normalizedPrimitiveLexeme: NormalizedPrimitiveLexeme) {
    return (LexemeNormalizer.NORMALIZED_CONTRACTION_TO_NORMALIZED_NORMAL.get(normalizedPrimitiveLexeme) ||
      normalizedPrimitiveLexeme) as NormalizedPrimitiveLexeme;
  }

  public static isWordCharacter(normalizedPrimitiveLexeme: NormalizedPrimitiveLexeme) {
    if (normalizedPrimitiveLexeme.length !== 1) {
      throw new Error('Can be used only for characters');
    }

    return (
      LexemeNormalizer.isLetter(normalizedPrimitiveLexeme) ||
      LexemeNormalizer.isWordHelpingCharacter(normalizedPrimitiveLexeme)
    );
  }

  public static isLetter(normalizedPrimitiveLexeme: NormalizedPrimitiveLexeme) {
    return LexemeNormalizer.LETTER_RE.test(normalizedPrimitiveLexeme);
  }

  public static isWordHelpingCharacter(normalizedPrimitiveLexeme: NormalizedPrimitiveLexeme) {
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
}

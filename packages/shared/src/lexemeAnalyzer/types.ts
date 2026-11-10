export enum LexemeType {
  Word = "w",
  SpecialCharacter = "sc",
  Letter = "l",
  /** Means a dash or apostrophe that stands alone, such as the dash in `one - two`. */
  WordHelping = "wh",
}

export interface BaseLexeme {
  startIndex: number;
  endIndex: number;
  original: PrimitiveLexemeNominal;
  normalized: NormalizedPrimitiveLexemeNominal;
  uncontracted: NormalizedPrimitiveLexemeNominal;
}

export interface LexemeAnalysis {
  lexemes: Map<
    // Lexeme index
    number,
    Lexeme
  >;
  lexemesByWordLike: Map<
    // Lower-cased word. A word in `'s` or `'d` also sits under its base word
    string,
    Map<
      // Lexeme index
      number,
      Lexeme
    >
  >;
  wordLikeCount: number;
  otherCharacterCount: number;
}

export interface Lexeme extends BaseLexeme {
  type: LexemeType;
}

export type NormalizedPrimitiveLexemeNominal = string & {
  __type: "normalized";
};

export type PrimitiveLexemeNominal = string & {
  __type: "primitive";
};

/**
 * Means a lower-cased word that groups lexemes. A word in `'s` or `'d` also groups under its base
 * word, so a guess of `she` opens `she's` and `she`. The analyzer cannot uncontract these words:
 * `she's` can mean `she is`, `she has` or a possessive.
 */
export type GroupWordLikeNominal = string & {
  __type: "groupWordLike";
};

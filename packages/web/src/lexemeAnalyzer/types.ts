export enum LexemeType {
  Word = 'w',
  SpecialCharacter = 'sc',
  Letter = 'l',
  // E.g. dash in `re-configured` or apostrophe in`don't`
  WordHelping = 'wh',
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
    // Word
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

// Nominals

export type NormalizedPrimitiveLexemeNominal = string & {
  __type: 'normalized';
};

export type PrimitiveLexemeNominal = string & {
  __type: 'primitive';
};

export type GroupWordLikeNominal = string & {
  __type: 'groupWordLike';
};

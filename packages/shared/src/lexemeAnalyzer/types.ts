export enum LexemeType {
  Word = 'w',
  SpecialCharacter = 'sc',
  Letter = 'l',
  // E.g. dash in `re-configured` or apostrophe in `don't`
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

export type NormalizedPrimitiveLexemeNominal = string & {
  __type: 'normalized';
};

export type PrimitiveLexemeNominal = string & {
  __type: 'primitive';
};

// To workaround words like `Item's/I'd/She'd/He'd/He's/She's`. We cannot uncontract them, as they can be
// uncontracted in multiple ways (e.g. she's - she is / she has or it can be a possessive ’s), so we can simply
// let the user just use e.g. `she` and count it as `she's` and as `she`.
export type GroupWordLikeNominal = string & {
  __type: 'groupWordLike';
};

import { describe, expect, it } from 'vitest';

import { LexemeAnalyzerStore } from './LexemeAnalyzerStore';
import { LexemeAnalyzerUtils } from './lexemeAnalyzerUtils';
import { NormalizedPrimitiveLexemeNominal, PrimitiveLexemeNominal } from './types';

const lexeme = LexemeAnalyzerUtils.createLexeme(
  'One' as PrimitiveLexemeNominal,
  'One' as NormalizedPrimitiveLexemeNominal,
  0,
  2,
);

describe(LexemeAnalyzerStore, () => {
  it('should give the lexeme at an index, or undefined where there is none', () => {
    const lexemeAnalyzerStore = new LexemeAnalyzerStore();

    lexemeAnalyzerStore.addLexeme(lexeme);

    expect(lexemeAnalyzerStore.getLexeme(0)).toBe(lexeme);
    expect(lexemeAnalyzerStore.getLexeme(1)).toBeUndefined();
  });

  it('should give a copy of the lexemes, which the caller cannot change the store through', () => {
    const lexemeAnalyzerStore = new LexemeAnalyzerStore();

    lexemeAnalyzerStore.addLexeme(lexeme);
    lexemeAnalyzerStore.lexemes.delete(0);

    expect(lexemeAnalyzerStore.lexemes.size).toBe(1);
  });
});

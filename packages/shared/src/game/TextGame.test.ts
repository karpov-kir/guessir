import { describe, expect, it } from 'vitest';

import { TextGame } from './TextGame';

const textGame = new TextGame("One, she's\none!");

describe(TextGame, () => {
  it('should give the length of every word and the character of every other lexeme', () => {
    expect(textGame.lexemes()).toEqual([
      { index: 0, length: 3 },
      { index: 1, character: ',' },
      { index: 2, character: ' ' },
      { index: 3, length: 5 },
      { index: 4, character: '\n' },
      { index: 5, length: 3 },
      { index: 6, character: '!' },
    ]);
  });

  it('should count the words', () => {
    expect(textGame.wordCount).toBe(3);
  });

  it('should reveal every word that matches a trimmed and lower-cased guess', () => {
    expect(textGame.guess(' ONE ')).toEqual([
      { index: 0, word: 'One' },
      { index: 5, word: 'one' },
    ]);
  });

  it('should reveal a contraction by its first word', () => {
    expect(textGame.guess('she')).toEqual([{ index: 3, word: "she's" }]);
  });

  it('should reveal nothing for a miss', () => {
    expect(textGame.guess('two')).toEqual([]);
  });

  it('should reveal a word by its index', () => {
    expect(textGame.reveal(3)).toEqual({ index: 3, word: "she's" });
  });

  it.each([1, 7, -1])('should reveal nothing at index %i, which holds no word', (index) => {
    expect(textGame.reveal(index)).toBeUndefined();
  });

  it('should give the first letter of every word', () => {
    expect(textGame.firstLetters()).toEqual([
      { index: 0, word: 'O' },
      { index: 3, word: 's' },
      { index: 5, word: 'o' },
    ]);
  });

  it('should give every word', () => {
    expect(textGame.words()).toEqual([
      { index: 0, word: 'One' },
      { index: 3, word: "she's" },
      { index: 5, word: 'one' },
    ]);
  });
});

describe('a text with a character whose lower case is two characters', () => {
  it('should keep the character as an other-character lexeme', () => {
    expect(new TextGame('To İstanbul').lexemes()).toEqual([
      { index: 0, length: 2 },
      { index: 1, character: ' ' },
      { index: 2, character: 'İ' },
      { index: 3, length: 7 },
    ]);
  });
});

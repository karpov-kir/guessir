import { describe, expect, it } from 'vitest';

import { LocalGame } from './LocalGame';

const localGame = new LocalGame({
  title: 'Title',
  description: 'Description',
  text: 'One, one',
  allowShowingFirstLetters: true,
  allowShowingText: false,
});

describe(LocalGame, () => {
  it('should build the skeleton of the text', () => {
    expect(localGame.skeleton).toEqual({
      title: 'Title',
      description: 'Description',
      allowShowingFirstLetters: true,
      allowShowingText: false,
      wordCount: 2,
      lexemes: [
        { index: 0, length: 3 },
        { index: 1, character: ',' },
        { index: 2, character: ' ' },
        { index: 3, length: 3 },
      ],
    });
  });

  it('should answer a guess', async () => {
    await expect(localGame.guess('one')).resolves.toEqual([
      { index: 0, word: 'One' },
      { index: 3, word: 'one' },
    ]);
  });

  it('should reveal a word', async () => {
    await expect(localGame.reveal(3)).resolves.toEqual({ index: 3, word: 'one' });
  });

  it('should fail to reveal an index that holds no word', async () => {
    await expect(localGame.reveal(1)).rejects.toThrow('No word at index 1');
  });

  it('should give the first letters and the words', async () => {
    await expect(localGame.firstLetters()).resolves.toEqual([
      { index: 0, word: 'O' },
      { index: 3, word: 'o' },
    ]);
    await expect(localGame.words()).resolves.toEqual([
      { index: 0, word: 'One' },
      { index: 3, word: 'one' },
    ]);
  });
});

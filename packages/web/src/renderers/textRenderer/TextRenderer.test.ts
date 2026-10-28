import { TextGame } from '@guessir/shared/dist/game/TextGame';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getElements, TextRenderer } from './TextRenderer';
import { WordHint } from './WordRenderer';

const textGame = new TextGame(`
  One
  
  one, @ she's we'd!
`);
const lexemes = textGame.lexemes();
let textRenderer: TextRenderer;
const getLexemeElements = () => textRenderer.getElement().querySelectorAll<HTMLButtonElement>('.lexeme-container');
const getFirstLetterElements = () => textRenderer.getElement().querySelectorAll('.lexeme-first-letter');
const getShownLexemeElements = () =>
  Array.from(getLexemeElements()).filter((element) => element.classList.contains('show'));
const getWordTexts = () =>
  Array.from(getLexemeElements()).map((element) => element.querySelector('.lexeme')?.textContent);

describe(TextRenderer, () => {
  beforeEach(() => {
    textRenderer = new TextRenderer({
      lexemes,
      title: 'Test title',
      description: 'Test description',
    });
  });

  it('should render the text with every word hidden behind a placeholder', () => {
    const { titleElement, descriptionElement } = getElements(textRenderer.getElement());

    expect(titleElement.textContent).toBe('Test title');
    expect(descriptionElement.textContent).toBe('Test description');
    expect(getLexemeElements()).toHaveLength(4);
    expect(getFirstLetterElements()).toHaveLength(4);
    expect(getWordTexts()).toEqual(['___', '___', '_____', '____']);
    expect(textRenderer.getElement().textContent).toContain(',');
    expect(textRenderer.getElement().textContent).toContain('@');
    expect(textRenderer.getElement().textContent).not.toMatch(/one|she|we/i);
    expect(textRenderer.getElement().textContent).toContain('!');
    expect(textRenderer.getElement().querySelectorAll('br')).toHaveLength(2);
  });

  it('should not render the title and description if they are empty', () => {
    const { titleElement, descriptionElement } = getElements(new TextRenderer({ lexemes }).getElement());

    expect(titleElement.classList).toContain('hide');
    expect(descriptionElement.classList).toContain('hide');
  });

  it('should show guessed words', () => {
    const shownCount = textRenderer.showGuessedWords(textGame.guess('one'));
    const shownElements = getShownLexemeElements();

    expect(shownCount).toBe(2);
    expect(shownElements).toHaveLength(2);
    expect(shownElements[0].querySelector('.lexeme')?.textContent).toBe('One');
    expect(shownElements[1].querySelector('.lexeme')?.textContent).toBe('one');
  });

  it('should mark only the words of the last successful guess as just guessed', () => {
    const getFreshTexts = () =>
      Array.from(textRenderer.getElement().querySelectorAll('.lexeme-container.fresh')).map(
        (element) => element.querySelector('.lexeme')?.textContent,
      );

    textRenderer.showGuessedWords(textGame.guess('one'));
    expect(getFreshTexts()).toEqual(['One', 'one']);

    textRenderer.showGuessedWords(textGame.guess('not-known'));
    expect(getFreshTexts()).toEqual(['One', 'one']);

    textRenderer.showGuessedWords(textGame.guess("she's"));
    expect(getFreshTexts()).toEqual(["she's"]);

    // Repeating a guess opens nothing new, so it counts as a miss and leaves the highlight where it was
    textRenderer.showGuessedWords(textGame.guess('one'));
    expect(getFreshTexts()).toEqual(["she's"]);
  });

  it('should not count already shown words as shown', () => {
    textRenderer.showWord({ index: 0, word: 'One' });

    expect(textRenderer.showGuessedWords(textGame.guess('one'))).toBe(1);
  });

  it('should show nothing for a miss', () => {
    expect(textRenderer.showGuessedWords([])).toBe(0);
    expect(getShownLexemeElements()).toHaveLength(0);
  });

  it('should show a revealed word once', () => {
    expect(textRenderer.showWord({ index: 0, word: 'One' })).toBe(true);
    expect(textRenderer.showWord({ index: 0, word: 'One' })).toBe(false);
    expect(getShownLexemeElements()).toHaveLength(1);
    expect(getShownLexemeElements()[0].classList).not.toContain('fresh');
  });

  it('should ignore a word at an index it did not render', () => {
    expect(textRenderer.showWord({ index: 1, word: ',' })).toBe(false);
    expect(textRenderer.showGuessedWords([{ index: 1, word: ',' }])).toBe(0);
  });

  it('should pass on a click on a hidden word as a request to reveal it', () => {
    const revealRequestCallback = vi.fn();

    textRenderer.revealRequestEvent.subscribe(revealRequestCallback);
    getLexemeElements()[1].click();

    expect(revealRequestCallback).toBeCalledWith(textGame.guess('one')[1].index);
  });

  it('should fill the first letters and the words without showing them', () => {
    textRenderer.fillFirstLetters(textGame.firstLetters());
    textRenderer.fillWords(textGame.words());

    expect(Array.from(getFirstLetterElements()).map((element) => element.textContent)).toEqual(['O', 'o', 's', 'w']);
    expect(getWordTexts()).toEqual(['One', 'one', "she's", "we'd"]);
    expect(getShownLexemeElements()).toHaveLength(0);
  });

  it('should tell screen readers what each hint mode shows', () => {
    const getLabels = () => Array.from(getLexemeElements()).map((element) => element.getAttribute('aria-label'));

    textRenderer.fillFirstLetters(textGame.firstLetters());
    textRenderer.setHint(WordHint.FirstLetters);
    expect(getLabels()[0]).toBe('Hidden word starting with O, 3 letters');

    textRenderer.setHint(WordHint.Text);
    expect(getLabels()).toEqual([null, null, null, null]);

    textRenderer.setHint(WordHint.None);
    expect(getLabels()[0]).toBe('Hidden word, 3 letters');
  });

  it('should show one hint at once', () => {
    const { classList } = textRenderer.getElement();

    expect(classList).not.toContain('show-text');
    expect(classList).not.toContain('show-first-letters');

    textRenderer.setHint(WordHint.Text);
    expect(classList).toContain('show-text');
    expect(classList).not.toContain('show-first-letters');

    textRenderer.setHint(WordHint.FirstLetters);
    expect(classList).toContain('show-first-letters');
    expect(classList).not.toContain('show-text');

    textRenderer.setHint(WordHint.None);
    expect(classList).not.toContain('show-text');
    expect(classList).not.toContain('show-first-letters');
  });
});

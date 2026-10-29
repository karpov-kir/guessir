import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WordHint, WordRenderer } from './WordRenderer';

let wordRenderer: WordRenderer;
const getLexemeElement = () => wordRenderer.getElement().querySelector('.lexeme') as HTMLElement;
const getLexemeFirstLetterElement = () =>
  wordRenderer.getElement().querySelector('.lexeme-first-letter') as HTMLElement;
const getLabel = () => wordRenderer.getElement().getAttribute('aria-label');

describe(WordRenderer, () => {
  beforeEach(() => {
    wordRenderer = new WordRenderer({ index: 2, length: 4 });
  });

  it('should render a hidden placeholder as long as the word', () => {
    expect(getLexemeElement().textContent).toBe('____');
    expect(getLexemeFirstLetterElement().textContent).toBe('');
    expect(wordRenderer.getElement().classList).not.toContain('show');
  });

  it('should show the word', () => {
    wordRenderer.show('Test');

    expect(getLexemeElement().textContent).toBe('Test');
    expect(wordRenderer.isShown).toBe(true);
    expect(wordRenderer.getElement().classList).toContain('show');
  });

  it('should fill the word without showing it', () => {
    wordRenderer.setWord('Test');

    expect(getLexemeElement().textContent).toBe('Test');
    expect(wordRenderer.isShown).toBe(false);
  });

  it('should name a hidden word for screen readers until it is shown', () => {
    expect(getLabel()).toBe('Hidden word, 4 letters');

    wordRenderer.show('Test');

    expect(wordRenderer.getElement().hasAttribute('aria-label')).toBe(false);
  });

  it('should name the first letter only once it is known', () => {
    wordRenderer.setHint(WordHint.FirstLetters);
    expect(getLabel()).toBe('Hidden word, 4 letters');

    wordRenderer.setFirstLetter('T');
    expect(getLexemeFirstLetterElement().textContent).toBe('T');
    expect(getLabel()).toBe('Hidden word starting with T, 4 letters');

    wordRenderer.setHint(WordHint.Text);
    expect(wordRenderer.getElement().hasAttribute('aria-label')).toBe(false);
  });

  it('should mark a word as just guessed', () => {
    wordRenderer.markFresh(true);
    expect(wordRenderer.getElement().classList).toContain('fresh');

    wordRenderer.markFresh(false);
    expect(wordRenderer.getElement().classList).not.toContain('fresh');
  });

  it('should ask to reveal a hidden word on click', () => {
    const revealRequestCallback = vi.fn();

    wordRenderer.revealRequestEvent.subscribe(revealRequestCallback);
    wordRenderer.getElement().click();

    expect(revealRequestCallback).toBeCalledWith(2);
  });

  it('should not ask to reveal a shown word', () => {
    const revealRequestCallback = vi.fn();

    wordRenderer.revealRequestEvent.subscribe(revealRequestCallback);
    wordRenderer.show('Test');
    wordRenderer.getElement().click();

    expect(revealRequestCallback).not.toBeCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Lexeme } from '../../lexemeAnalyzer/types';
import { WordRenderer } from './WordRenderer';

let wordRenderer: WordRenderer;
const mockedLexeme = {
  normalized: 'Test',
} as Lexeme;
const getLexemeElement = () => wordRenderer.getElement().querySelector('.lexeme') as HTMLElement;
const getLexemeFirstLetterElement = () =>
  wordRenderer.getElement().querySelector('.lexeme-first-letter') as HTMLElement;

describe(WordRenderer, () => {
  beforeEach(() => {
    wordRenderer = new WordRenderer({
      lexeme: mockedLexeme,
    });
  });

  it('should render the word', () => {
    expect(getLexemeElement().textContent).toBe('Test');
    expect(getLexemeFirstLetterElement().textContent).toBe('T');
    // Must be rendered hidden initially
    expect(getLexemeElement().classList).not.toContain('show');
  });

  it('should show the word on click', () => {
    wordRenderer.getElement().click();

    expect(wordRenderer.getElement().classList).toContain('show');
  });

  it('should name a hidden word for screen readers until it is shown', () => {
    expect(wordRenderer.getElement().getAttribute('aria-label')).toBe('Hidden word, 4 letters');

    wordRenderer.show();

    expect(wordRenderer.getElement().hasAttribute('aria-label')).toBe(false);
  });

  it('should mark a word as just guessed', () => {
    wordRenderer.markFresh(true);
    expect(wordRenderer.getElement().classList).toContain('fresh');

    wordRenderer.markFresh(false);
    expect(wordRenderer.getElement().classList).not.toContain('fresh');
  });

  it('should not notify about about second click', () => {
    const userWordShowCallback = vi.fn();

    wordRenderer.userWordShowEvent.subscribe(userWordShowCallback);
    wordRenderer.getElement().click();
    wordRenderer.getElement().click();

    expect(userWordShowCallback).toBeCalledTimes(1);
    expect(userWordShowCallback).toBeCalledWith(mockedLexeme);
  });
});

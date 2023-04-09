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

  it('should not notify about about second click', () => {
    const userWordShowCallback = jest.fn();

    wordRenderer.userWordShowEvent.subscribe(userWordShowCallback);
    wordRenderer.getElement().click();
    wordRenderer.getElement().click();

    expect(userWordShowCallback).toBeCalledTimes(1);
    expect(userWordShowCallback).toBeCalledWith(mockedLexeme);
  });
});

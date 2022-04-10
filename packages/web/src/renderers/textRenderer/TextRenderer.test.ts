import { LexemeAnalyzer } from '../../lexemeAnalyzer';
import { getElements, TextRenderer } from './TextRenderer';

const lexemeAnalysis = new LexemeAnalyzer().analyze(`
  One
  
  one, @ she's we'd!
`);
let textRenderer: TextRenderer;
const getLexemeElements = () => textRenderer.getElement().querySelectorAll<HTMLButtonElement>('.lexeme-container');
const getFirstLetterElements = () => textRenderer.getElement().querySelectorAll('.lexeme-first-letter');
const getShownLexemeElements = () =>
  Array.from(getLexemeElements()).filter((element) => element.classList.contains('show'));

describe(TextRenderer, () => {
  beforeEach(() => {
    textRenderer = new TextRenderer(lexemeAnalysis, 'Test title', 'Test description');
  });

  it('should render text', () => {
    const { titleElement, descriptionElement } = getElements(textRenderer.getElement());

    expect(titleElement.textContent).toBe('Test title');
    expect(descriptionElement.textContent).toBe('Test description');
    expect(getLexemeElements()).toHaveLength(4);
    expect(getFirstLetterElements()).toHaveLength(4);
    expect(textRenderer.getElement().textContent).toContain(',');
    expect(textRenderer.getElement().textContent).toContain('@');
    expect(textRenderer.getElement().textContent).toContain("'");
    expect(textRenderer.getElement().textContent).toContain('!');
    expect(textRenderer.getElement().querySelectorAll('br')).toHaveLength(2);
  });

  it('should not render the title and description if they are empty', () => {
    const { titleElement, descriptionElement } = getElements(new TextRenderer(lexemeAnalysis).getElement());

    expect(titleElement.classList).toContain('hide');
    expect(descriptionElement.classList).toContain('hide');
  });

  it('should show lexemes by word', () => {
    const shownCount = textRenderer.showLexemesByWord('one');
    const shownElements = getShownLexemeElements();

    expect(shownCount).toBe(2);
    expect(shownElements).toHaveLength(2);
    expect(shownElements[0].querySelector('.lexeme')?.textContent).toBe('One');
    expect(shownElements[1].querySelector('.lexeme')?.textContent).toBe('one');
  });

  it('should not count already shown lexemes as shown', () => {
    const lexemeElements = getLexemeElements();

    // The first word is `One`. Show only it directly and left the second word `one` hidden.
    lexemeElements[0].click();

    const shownCount = textRenderer.showLexemesByWord('one');

    // There should be left only the second `one` word
    expect(shownCount).toBe(1);
  });

  it('should not show lexemes by word if the word is not known', () => {
    expect(textRenderer.showLexemesByWord('not-known')).toBe(0);
    expect(getShownLexemeElements()).toHaveLength(0);
  });

  it('should toggle text', () => {
    expect(textRenderer.getElement().classList).not.toContain('show-text');

    textRenderer.toggleText(true);
    expect(textRenderer.getElement().classList).toContain('show-text');

    textRenderer.toggleText(false);
    expect(textRenderer.getElement().classList).not.toContain('show-text');
  });

  it('should toggle first letters', () => {
    expect(textRenderer.getElement().classList).not.toContain('show-first-letters');

    textRenderer.toggleFirstLetters(true);
    expect(textRenderer.getElement().classList).toContain('show-first-letters');

    textRenderer.toggleFirstLetters(false);
    expect(textRenderer.getElement().classList).not.toContain('show-first-letters');
  });

  it('should be enabled showing only text or first letters at once', () => {
    textRenderer.toggleText(true);
    textRenderer.toggleFirstLetters(true);
    expect(textRenderer.getElement().classList).toContain('show-first-letters');
    expect(textRenderer.getElement().classList).not.toContain('show-text');

    textRenderer.toggleText(true);
    expect(textRenderer.getElement().classList).toContain('show-text');
    expect(textRenderer.getElement().classList).not.toContain('show-first-letters');
  });
});

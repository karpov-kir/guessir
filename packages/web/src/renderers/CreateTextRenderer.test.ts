import { TextInterface } from '@guessir/shared';

import { Deferred } from '../utils';
import { CreateTextRenderer, getElements } from './CreateTextRenderer';

const mockedText = {
  id: 'mocked-id',
} as TextInterface;
const mockedCreateText = jest.fn().mockResolvedValue(mockedText);

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  createText: (...args: unknown[]) => mockedCreateText(...args),
  generateTextUrl: () => 'http://mocked-url',
}));

let createTextRenderer: CreateTextRenderer;

describe(CreateTextRenderer, () => {
  beforeEach(() => {
    createTextRenderer = new CreateTextRenderer({ maxTitleLength: 2, maxDescriptionLength: 2, maxTextLength: 2 });
  });

  it('should create a text when the form is submitted', async () => {
    const {
      textInputElement,
      titleInputElement,
      descriptionInputElement,
      allowShowingFirstLettersCheckboxElement,
      generateUrlButtonElement,
    } = getElements(createTextRenderer.getElement());
    const deferred = new Deferred<TextInterface>();

    mockedCreateText.mockReturnValue(deferred.promise);

    textInputElement.value = 'Text text';
    titleInputElement.value = 'Test title';
    descriptionInputElement.value = 'Test description';
    allowShowingFirstLettersCheckboxElement.checked = false;

    generateUrlButtonElement.click();
    deferred.resolve(mockedText);
    await deferred.promise;

    expect(mockedCreateText).toBeCalledWith({
      allowShowingFirstLetters: false,
      allowShowingText: true,
      description: 'Test description',
      text: 'Text text',
      title: 'Test title',
    });
  });

  it('should render inputs without validation classes by default', () => {
    const { textInputElement, titleInputElement } = getElements(createTextRenderer.getElement());

    expect(!titleInputElement.classList.contains('invalid'));
    expect(!textInputElement.classList.contains('invalid'));
  });

  it('should validate inputs on submit', () => {
    const { textInputElement, titleInputElement, generateUrlButtonElement } = getElements(
      createTextRenderer.getElement(),
    );

    generateUrlButtonElement.click();

    expect(titleInputElement.classList.contains('invalid'));
    expect(textInputElement.classList.contains('invalid'));
  });

  it('should validate inputs on change', () => {
    const { textInputElement, titleInputElement } = getElements(createTextRenderer.getElement());

    titleInputElement.dispatchEvent(new KeyboardEvent('keypress'));
    textInputElement.dispatchEvent(new KeyboardEvent('keypress'));

    expect(titleInputElement.classList.contains('invalid'));
    expect(textInputElement.classList.contains('invalid'));
  });

  it('should limit inputs length', () => {
    const { textInputElement, titleInputElement, descriptionInputElement } = getElements(
      createTextRenderer.getElement(),
    );
    const elements = [textInputElement, titleInputElement, descriptionInputElement];

    elements.forEach((element) => {
      element.value = '  asd  ';
      element.dispatchEvent(new Event('input'));

      expect(element.parentElement?.querySelector('.limit-text')?.textContent).toBe('2/2');
    });
  });
});

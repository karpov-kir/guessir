import { TextInterface } from '@guessir/shared/dist/TextInterface';

import { Deferred } from '../utils/Deferred';
import { CreateTextRenderer, getElements } from './CreateTextRenderer';

const mockedText = {
  id: 'mocked-id',
} as TextInterface;
const mockedCreateText = jest.fn().mockResolvedValue(mockedText);

jest.mock('../utils/text', () => ({
  ...jest.requireActual('../utils/text'),
  createText: (...args: unknown[]) => mockedCreateText(...args),
  generateTextUrl: () => 'http://mocked-url',
}));

let createTextRenderer: CreateTextRenderer;

const createText = async () => {
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
};

describe(CreateTextRenderer, () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();

    createTextRenderer = new CreateTextRenderer({ maxTitleLength: 2, maxDescriptionLength: 2, maxTextLength: 2 });
  });

  it('should create a text when the form is submitted', async () => {
    const { generatedUrlElement, generatedUrlContainerElement } = getElements(createTextRenderer.getElement());

    expect(generatedUrlContainerElement.classList).toContain('hide');

    await createText();

    expect(mockedCreateText).toBeCalledWith({
      allowShowingFirstLetters: false,
      allowShowingText: true,
      description: 'Test description',
      text: 'Text text',
      title: 'Test title',
    });
    expect(generatedUrlElement.textContent).toBe('http://mocked-url');
    expect(generatedUrlElement.href).toBe('http://mocked-url/');
    expect(generatedUrlContainerElement.classList).not.toContain('hide');
  });

  it('should render an error if text creation fails', async () => {
    const deferred = new Deferred<TextInterface>();
    const { errorElement, generateUrlButtonElement, textInputElement, titleInputElement } = getElements(
      createTextRenderer.getElement(),
    );

    mockedCreateText.mockReturnValue(deferred.promise);

    // Set required fields
    textInputElement.value = 'Text text';
    titleInputElement.value = 'Test title';

    expect(errorElement.classList).toContain('hide');

    generateUrlButtonElement.click();
    deferred.reject(new Error('Test error'));
    await deferred.promise.catch(() => void 0);

    expect(errorElement.textContent).toBe('Test error');
    expect(errorElement.classList).not.toContain('hide');
  });

  it('should disable form while a request is executing', async () => {
    const deferred = new Deferred<TextInterface>();
    const { textInputElement, titleInputElement, generateUrlButtonElement } = getElements(
      createTextRenderer.getElement(),
    );
    const containerElement = createTextRenderer.getElement();
    const getDisabledElements = () => containerElement.querySelectorAll('input:disabled, textarea:disabled');

    mockedCreateText.mockReturnValue(deferred.promise);

    // Set required fields
    textInputElement.value = 'Text text';
    titleInputElement.value = 'Test title';

    expect(getDisabledElements()).toHaveLength(0);

    generateUrlButtonElement.click();

    expect(getDisabledElements()).toHaveLength(5);

    deferred.resolve(mockedText);
    // Wait for `finally` as the form is unblocked in the finally block
    await deferred.promise.finally(() => void 0);

    expect(getDisabledElements()).toHaveLength(0);
  });

  it('should not submit an invalid form', () => {
    const { generateUrlButtonElement } = getElements(createTextRenderer.getElement());

    generateUrlButtonElement.click();

    expect(mockedCreateText).not.toBeCalled();
  });

  it('should initialize inputs without validation classes', () => {
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

  it('should copy a generated URL on click', async () => {
    const mockedWriteText = jest.fn();
    const { copyGeneratedUrlButtonElement } = getElements(createTextRenderer.getElement());

    Object.assign(navigator, {
      clipboard: {
        writeText: mockedWriteText,
      },
    });

    await createText();
    copyGeneratedUrlButtonElement.click();

    expect(mockedWriteText).toBeCalledWith('http://mocked-url');
  });

  it('should hide the alert that a generated URL was copied on a timeout', async () => {
    const { copyGeneratedUrlButtonElement } = getElements(createTextRenderer.getElement());

    jest.useFakeTimers();

    await createText();
    copyGeneratedUrlButtonElement.click();

    expect(copyGeneratedUrlButtonElement.querySelector('div')?.textContent).toBe('(copied)');

    jest.runAllTimers();

    expect(copyGeneratedUrlButtonElement.querySelector('div')).toBe(null);
  });
});

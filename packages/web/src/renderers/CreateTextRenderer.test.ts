import { Text } from '@guessir/shared/dist/Text';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';

import { ApiClient } from '../utils/ApiClient';
import { Deferred } from '../utils/Deferred';
import { CreateTextRenderer, getElements } from './CreateTextRenderer';

const mockedText = {
  id: 'mocked-id',
} as Text;
let mockedApiClient: MockProxy<ApiClient>;
let createTextRenderer: CreateTextRenderer;

const createText = async () => {
  const {
    textInputElement,
    titleInputElement,
    descriptionInputElement,
    allowShowingFirstLettersCheckboxElement,
    generateUrlButtonElement,
  } = getElements(createTextRenderer.getElement());
  const deferred = new Deferred<Text>();

  mockedApiClient.createText.mockReturnValue(deferred.promise);

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
    vi.useRealTimers();

    mockedApiClient = mock<ApiClient>();
    createTextRenderer = new CreateTextRenderer({
      maxTitleLength: 2,
      maxDescriptionLength: 2,
      maxTextLength: 2,
      apiClient: mockedApiClient,
    });
  });

  it('should create a text when the form is submitted', async () => {
    const { generatedUrlElement, generatedUrlContainerElement } = getElements(createTextRenderer.getElement());

    expect(generatedUrlContainerElement.classList).toContain('hide');

    await createText();

    expect(mockedApiClient.createText).toBeCalledWith({
      allowShowingFirstLetters: false,
      allowShowingText: true,
      description: 'Test description',
      text: 'Text text',
      title: 'Test title',
    });
    expect(generatedUrlElement.textContent).toBe('http://localhost:3000?textId=mocked-id');
    expect(generatedUrlElement.href).toBe('http://localhost:3000/?textId=mocked-id');
    expect(generatedUrlContainerElement.classList).not.toContain('hide');
  });

  it('should render an error if text creation fails', async () => {
    const deferred = new Deferred<Text>();
    const { errorElement, generateUrlButtonElement, textInputElement, titleInputElement } = getElements(
      createTextRenderer.getElement(),
    );

    mockedApiClient.createText.mockReturnValue(deferred.promise);

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
    const deferred = new Deferred<Text>();
    const { textInputElement, titleInputElement, generateUrlButtonElement } = getElements(
      createTextRenderer.getElement(),
    );
    const containerElement = createTextRenderer.getElement();
    const getDisabledElements = () => containerElement.querySelectorAll('input:disabled, textarea:disabled');

    mockedApiClient.createText.mockReturnValue(deferred.promise);

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

    expect(mockedApiClient.createText).not.toBeCalled();
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
    const mockedWriteText = vi.fn();
    const { copyGeneratedUrlButtonElement } = getElements(createTextRenderer.getElement());

    Object.assign(navigator, {
      clipboard: {
        writeText: mockedWriteText,
      },
    });

    await createText();
    copyGeneratedUrlButtonElement.click();

    expect(mockedWriteText).toBeCalledWith('http://localhost:3000?textId=mocked-id');
  });

  it('should hide the alert that a generated URL was copied on a timeout', async () => {
    const { copyGeneratedUrlButtonElement } = getElements(createTextRenderer.getElement());

    vi.useFakeTimers();

    await createText();
    copyGeneratedUrlButtonElement.click();

    expect(copyGeneratedUrlButtonElement.querySelector('div')?.textContent).toBe('(copied)');

    vi.runAllTimers();

    expect(copyGeneratedUrlButtonElement.querySelector('div')).toBe(null);
  });
});

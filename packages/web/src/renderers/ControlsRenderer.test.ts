import { describe, expect, it, vi } from 'vitest';

import { PubSub } from '../pubSub/PubSub';
import { Deferred } from '../utils/Deferred';
import { ControlsRenderer, getElements, GuessEvent } from './ControlsRenderer';

const typeGuess = (guessInputElement: HTMLInputElement, word: string) => {
  guessInputElement.value = word;
  guessInputElement.dispatchEvent(new Event('input'));
};

describe(ControlsRenderer, () => {
  it('should be initialized with default values', () => {
    const controlsRenderer = new ControlsRenderer({
      allowShowingFirstLetters: true,
      allowShowingText: true,
    });
    const { showTextCheckboxElement, showFirstLettersCheckboxElement } = getElements(controlsRenderer.getElement());

    expect(showTextCheckboxElement.checked).toBe(false);
    expect(showFirstLettersCheckboxElement.checked).toBe(false);
  });

  it('should be initialized with disabled showing first letters checkbox', () => {
    const controlsRenderer = new ControlsRenderer({
      allowShowingFirstLetters: false,
      allowShowingText: true,
    });
    const hiddenElements = controlsRenderer.getElement().querySelectorAll('.hide');

    expect(hiddenElements).toHaveLength(1);
    expect(hiddenElements?.[0].querySelector('#show-first-letters-checkbox')).toEqual(expect.any(HTMLElement));
  });

  it('should be initialized with disabled showing text checkbox', () => {
    const controlsRenderer = new ControlsRenderer({
      allowShowingFirstLetters: true,
      allowShowingText: false,
    });
    const hiddenElements = controlsRenderer.getElement().querySelectorAll('.hide');

    expect(hiddenElements).toHaveLength(1);
    expect(hiddenElements?.[0].querySelector('#show-text-checkbox')).toEqual(expect.any(HTMLElement));
  });

  it.each([
    { trigger: 'a click', submit: (element: HTMLElement) => element.click() },
    {
      trigger: 'Enter',
      submit: (element: HTMLElement) => element.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' })),
    },
    {
      trigger: 'NumpadEnter',
      submit: (element: HTMLElement) => element.dispatchEvent(new KeyboardEvent('keypress', { key: 'NumpadEnter' })),
    },
  ])('should publish a guess event with a trimmed word in its typed case on $trigger', ({ trigger, submit }) => {
    const guessPubSub = new PubSub<GuessEvent>();
    const controlsRenderer = new ControlsRenderer({ guessPubSub });
    const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());

    vi.spyOn(guessPubSub, 'publish');

    typeGuess(guessInputElement, ' TeST# ');
    submit(trigger === 'a click' ? guessButtonElement : guessInputElement);

    expect(guessPubSub.publish).toBeCalledWith({ word: 'TeST#' });
  });

  it('should empty and focus the input, disable the button and clear the status on a guess', () => {
    const controlsRenderer = new ControlsRenderer();
    const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());
    const statusElement = controlsRenderer.getElement().querySelector('[role="status"]') as HTMLElement;

    controlsRenderer.announce('No new words for this guess');
    vi.spyOn(guessInputElement, 'focus');
    typeGuess(guessInputElement, 'test');

    guessButtonElement.click();

    expect(guessInputElement.value).toBe('');
    expect(guessInputElement.focus).toBeCalled();
    expect(guessButtonElement.disabled).toBe(true);
    expect(statusElement.textContent).toBe('');
  });

  it('should send a guess submitted twice only once', () => {
    const guessPubSub = new PubSub<GuessEvent>();
    const controlsRenderer = new ControlsRenderer({ guessPubSub });
    const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());

    vi.spyOn(guessPubSub, 'publish');
    typeGuess(guessInputElement, 'test');

    guessButtonElement.click();
    guessInputElement.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));

    expect(guessPubSub.publish).toBeCalledTimes(1);
  });

  it('should hand a guess back into the empty input and enable the button, so the player can correct it', () => {
    const controlsRenderer = new ControlsRenderer();
    const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());

    typeGuess(guessInputElement, 'test');
    guessButtonElement.click();

    controlsRenderer.returnGuess('test');

    expect(guessInputElement.value).toBe('test');
    expect(guessButtonElement.disabled).toBe(false);
  });

  it('should keep the word the player typed while the guess was checked', () => {
    const controlsRenderer = new ControlsRenderer();
    const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());

    typeGuess(guessInputElement, 'test');
    guessButtonElement.click();
    typeGuess(guessInputElement, 'next');

    controlsRenderer.returnGuess('test');

    expect(guessInputElement.value).toBe('next');
    expect(guessButtonElement.disabled).toBe(false);
  });

  it('should not publish a guess event if the word is empty', () => {
    const guessPubSub = new PubSub<GuessEvent>();
    const controlsRenderer = new ControlsRenderer({
      allowShowingFirstLetters: true,
      allowShowingText: true,
      guessPubSub,
    });
    const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());

    vi.spyOn(guessPubSub, 'publish');

    // Set to a string with spaces only to make sure that they are trimmed
    guessInputElement.value = '  ';
    guessButtonElement.click();

    expect(guessPubSub.publish).not.toBeCalled();
  });

  it('should show first letters on a click', () => {
    const controlsRenderer = new ControlsRenderer({
      allowShowingFirstLetters: true,
      allowShowingText: true,
    });
    const { showFirstLettersCheckboxElement } = getElements(controlsRenderer.getElement());

    showFirstLettersCheckboxElement.click();
  });

  it.each([
    { type: 'first-letters', selector: '#show-first-letters-checkbox' },
    { type: 'text', selector: '#show-text-checkbox' },
  ] as const)('should toggle $type', ({ type, selector }) => {
    const showFirstLettersPubSub = new PubSub<boolean>();
    const showTextPubSub = new PubSub<boolean>();
    const controlsRenderer = new ControlsRenderer({
      allowShowingFirstLetters: true,
      allowShowingText: true,
      showFirstLettersPubSub,
      showTextPubSub,
    });
    const checkboxElement = controlsRenderer.getElement().querySelector(selector) as HTMLInputElement;

    vi.spyOn(showFirstLettersPubSub, 'publish');
    vi.spyOn(showTextPubSub, 'publish');

    checkboxElement.dispatchEvent(new Event('change'));
    checkboxElement.dispatchEvent(new Event('change'));
    checkboxElement.dispatchEvent(
      new KeyboardEvent('keypress', {
        key: 'Enter',
      }),
    );
    checkboxElement.dispatchEvent(
      new KeyboardEvent('keypress', {
        key: 'NumpadEnter',
      }),
    );

    const pubSub = type === 'first-letters' ? showFirstLettersPubSub : showTextPubSub;

    expect(pubSub.publish).nthCalledWith(1, true);
    expect(pubSub.publish).nthCalledWith(2, false);
    expect(pubSub.publish).nthCalledWith(3, true);
    expect(pubSub.publish).nthCalledWith(4, false);
  });

  it.each([
    {
      typeA: 'first letters',
      selectorA: '#show-first-letters-checkbox',
      selectorB: '#show-text-checkbox',
    },
    {
      typeA: 'text',
      selectorA: '#show-text-checkbox',
      selectorB: '#show-first-letters-checkbox',
    },
  ] as const)('should disable $typeA when $typeB is enabled', ({ typeA, selectorA, selectorB }) => {
    const showFirstLettersPubSub = new PubSub<boolean>();
    const showTextPubSub = new PubSub<boolean>();
    const controlsRenderer = new ControlsRenderer({
      allowShowingFirstLetters: true,
      allowShowingText: true,
      showFirstLettersPubSub,
      showTextPubSub,
    });
    const checkboxA = controlsRenderer.getElement().querySelector(selectorA) as HTMLInputElement;
    const checkboxB = controlsRenderer.getElement().querySelector(selectorB) as HTMLInputElement;

    // Enable one of the checkboxes
    checkboxB.dispatchEvent(new Event('change'));

    const pubSubA = typeA === 'first letters' ? showFirstLettersPubSub : showTextPubSub;
    const pubSubB = typeA === 'first letters' ? showTextPubSub : showFirstLettersPubSub;

    // Start spying only after checkboxes are set to default values to not seed mocks with redundant calls
    vi.spyOn(pubSubA, 'publish');
    vi.spyOn(pubSubB, 'publish');

    // Enable the other checkbox
    checkboxA.dispatchEvent(new Event('change'));

    // Firstly, the changed (clicked) one should be enabled
    expect(pubSubA.publish).nthCalledWith(1, true);
    // Secondly, the other should be disabled
    expect(pubSubB.publish).nthCalledWith(1, false);
  });

  it('should render the guess button disabled initially', () => {
    const controlsRenderer = new ControlsRenderer();
    const guessButtonElement = controlsRenderer.getElement().querySelector('button') as HTMLButtonElement;

    expect(guessButtonElement.disabled).toBe(true);
  });

  it('should enable the guess button on input', () => {
    const controlsRenderer = new ControlsRenderer();

    const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());

    typeGuess(guessInputElement, ' TeST# ');

    expect(guessButtonElement.disabled).toBe(false);
  });

  it('should not enable the guess button on input that consists of spaces only', () => {
    const controlsRenderer = new ControlsRenderer();
    const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());

    typeGuess(guessInputElement, '   ');

    expect(guessButtonElement.disabled).toBe(true);
  });

  it('should animate the guess button on input that does not exist', async () => {
    const controlsRenderer = new ControlsRenderer();
    const { guessInputElement } = getElements(controlsRenderer.getElement());
    const hasShakeAndErrorBefore = guessInputElement.classList.contains('shake-and-error');

    controlsRenderer.shakeAndError();

    const hasShakeAndErrorAfterTriggered = guessInputElement.classList.contains('shake-and-error');
    const animationEndDeferred = new Deferred();

    guessInputElement.addEventListener('animationend', () => {
      animationEndDeferred.resolve(undefined);
    });
    guessInputElement.dispatchEvent(new Event('animationend'));

    await animationEndDeferred.promise;

    expect(hasShakeAndErrorBefore).toBe(false);
    expect(hasShakeAndErrorAfterTriggered).toBe(true);
    expect(guessInputElement.classList.contains('shake-and-error')).toBe(false);
  });

  it('should announce a wrong guess', () => {
    const controlsRenderer = new ControlsRenderer();
    const statusElement = controlsRenderer.getElement().querySelector('[role="status"]') as HTMLElement;

    expect(statusElement.textContent).toBe('');

    controlsRenderer.shakeAndError();
    expect(statusElement.textContent).toBe('No new words for this guess');
  });

  it('should show a status on screen under the guess row and announce it to screen readers', () => {
    const controlsRenderer = new ControlsRenderer();
    const statusElement = controlsRenderer.getElement().querySelector('[role="status"]') as HTMLElement;
    const guessContainerElement = controlsRenderer.getElement().querySelector('#guess-container') as HTMLElement;

    controlsRenderer.announce('Could not check this guess');

    expect(statusElement.textContent).toBe('Could not check this guess');
    expect(statusElement.classList.contains('visually-hidden')).toBe(false);
    expect(guessContainerElement.nextElementSibling).toBe(statusElement);
  });

  it.each([
    { type: 'first letters', selector: '#show-first-letters-checkbox', uncheck: 'uncheckFirstLetters' },
    { type: 'text', selector: '#show-text-checkbox', uncheck: 'uncheckText' },
  ] as const)('should uncheck $type without publishing, so the next change turns it on', ({ selector, uncheck }) => {
    const showFirstLettersPubSub = new PubSub<boolean>();
    const showTextPubSub = new PubSub<boolean>();
    const controlsRenderer = new ControlsRenderer({
      allowShowingFirstLetters: true,
      allowShowingText: true,
      showFirstLettersPubSub,
      showTextPubSub,
    });
    const checkboxElement = controlsRenderer.getElement().querySelector(selector) as HTMLInputElement;

    checkboxElement.dispatchEvent(new Event('change'));
    vi.spyOn(showFirstLettersPubSub, 'publish');
    vi.spyOn(showTextPubSub, 'publish');

    controlsRenderer[uncheck]();

    expect(checkboxElement.checked).toBe(false);
    expect(showFirstLettersPubSub.publish).not.toBeCalled();
    expect(showTextPubSub.publish).not.toBeCalled();

    checkboxElement.dispatchEvent(new Event('change'));

    expect(checkboxElement.checked).toBe(true);
  });
});

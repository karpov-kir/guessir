import { describe, expect, it, vi } from 'vitest';

import { PubSub } from '../pubSub/PubSub';
import { Deferred } from '../utils/Deferred';
import { ControlsRenderer, GuessEvent } from './ControlsRenderer';

describe(ControlsRenderer, () => {
  it('should be initialized with default values', () => {
    const controlsRenderer = new ControlsRenderer({
      allowShowingFirstLetters: true,
      allowShowingText: true,
    });
    const showTextCheckboxElement = controlsRenderer
      .getElement()
      .querySelector('#show-text-checkbox') as HTMLInputElement;
    const showFirstLettersCheckboxElement = controlsRenderer
      .getElement()
      .querySelector('#show-first-letters-checkbox') as HTMLInputElement;

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

  it('should publish a guess event with a sanitized word', () => {
    const guessPubSub = new PubSub<GuessEvent>();
    const controlsRenderer = new ControlsRenderer({
      allowShowingFirstLetters: true,
      allowShowingText: true,
      guessPubSub,
    });
    const guessButtonElement = controlsRenderer.getElement().querySelector('#guess-button') as HTMLButtonElement;
    const guessInputElement = controlsRenderer.getElement().querySelector('#guess-input') as HTMLInputElement;

    vi.spyOn(guessPubSub, 'publish');

    // Input a value to guess
    guessInputElement.value = ' TeST# ';
    guessInputElement.dispatchEvent(new Event('input'));

    guessButtonElement.click();
    guessInputElement.dispatchEvent(
      new KeyboardEvent('keypress', {
        key: 'Enter',
      }),
    );
    guessInputElement.dispatchEvent(
      new KeyboardEvent('keypress', {
        key: 'NumpadEnter',
      }),
    );

    const expectedPayload = {
      word: 'test#',
    };

    expect(guessPubSub.publish).nthCalledWith(1, expectedPayload);
    expect(guessPubSub.publish).nthCalledWith(2, expectedPayload);
    expect(guessPubSub.publish).nthCalledWith(3, expectedPayload);
  });

  it('should not publish a guess event if the word is empty', () => {
    const guessPubSub = new PubSub<GuessEvent>();
    const controlsRenderer = new ControlsRenderer({
      allowShowingFirstLetters: true,
      allowShowingText: true,
      guessPubSub,
    });
    const guessButtonElement = controlsRenderer.getElement().querySelector('#guess-button') as HTMLButtonElement;
    const guessInputElement = controlsRenderer.getElement().querySelector('#guess-input') as HTMLInputElement;

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
    const showFirstLettersCheckboxElement = controlsRenderer
      .getElement()
      .querySelector('#show-first-letters-checkbox') as HTMLInputElement;

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

    const guessButtonElement = controlsRenderer.getElement().querySelector('#guess-button') as HTMLButtonElement;
    const guessInputElement = controlsRenderer.getElement().querySelector('#guess-input') as HTMLInputElement;

    // Input a value to guess
    guessInputElement.value = ' TeST# ';
    guessInputElement.dispatchEvent(new Event('input'));

    expect(guessButtonElement.disabled).toBe(false);
  });

  it('should not enable the guess button on input that consists of spaces only', () => {
    const controlsRenderer = new ControlsRenderer();
    const guessButtonElement = controlsRenderer.getElement().querySelector('#guess-button') as HTMLButtonElement;
    const guessInputElement = controlsRenderer.getElement().querySelector('#guess-input') as HTMLInputElement;

    // Input a value to guess
    guessInputElement.value = '   ';
    guessInputElement.dispatchEvent(new Event('input'));

    expect(guessButtonElement.disabled).toBe(true);
  });

  it('should animate the guess button on input that does not exist', async () => {
    const controlsRenderer = new ControlsRenderer();
    const guessInputElement = controlsRenderer.getElement().querySelector('#guess-input') as HTMLInputElement;
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

  it('should clear and focus the input', () => {
    const controlsRenderer = new ControlsRenderer();
    const guessInputElement = controlsRenderer.getElement().querySelector('#guess-input') as HTMLInputElement;

    guessInputElement.value = 'test';
    vi.spyOn(guessInputElement, 'focus');

    controlsRenderer.clearAndFocusGuessInput();

    expect(guessInputElement.value).toBe('');
    expect(guessInputElement.focus).toBeCalled();
  });

  it('should disable the guess button on clear and focus the input', () => {
    const controlsRenderer = new ControlsRenderer();
    const guessButtonElement = controlsRenderer.getElement().querySelector('#guess-button') as HTMLButtonElement;

    guessButtonElement.disabled = false;

    controlsRenderer.clearAndFocusGuessInput();

    expect(guessButtonElement.disabled).toBe(true);
  });
});

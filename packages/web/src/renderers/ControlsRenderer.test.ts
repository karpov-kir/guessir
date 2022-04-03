import { PubSub } from '../pubSub';
import { ControlsRenderer } from './ControlsRenderer';

describe(ControlsRenderer, () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be initialized with default values', () => {
    const controlsRenderer = new ControlsRenderer(true, true);
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
    const controlsRenderer = new ControlsRenderer(true, false);
    const hiddenElements = controlsRenderer.getElement().querySelectorAll('.hide');

    expect(hiddenElements).toHaveLength(1);
    expect(hiddenElements?.[0].querySelector('#show-first-letters-checkbox')).toEqual(expect.any(HTMLElement));
  });

  it('should be initialized with disabled showing first letters checkbox', () => {
    const controlsRenderer = new ControlsRenderer(false, true);
    const hiddenElements = controlsRenderer.getElement().querySelectorAll('.hide');

    expect(hiddenElements).toHaveLength(1);
    expect(hiddenElements?.[0].querySelector('#show-text-checkbox')).toEqual(expect.any(HTMLElement));
  });

  it('should publish a guess event with a sanitized word', () => {
    const controlsRenderer = new ControlsRenderer(true, true);
    const guessButtonElement = controlsRenderer.getElement().querySelector('#guess-button') as HTMLButtonElement;
    const guessInputElement = controlsRenderer.getElement().querySelector('#guess-input') as HTMLInputElement;

    jest.spyOn(PubSub.prototype, 'publish');

    guessInputElement.value = ' TeST# ';
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

    expect(PubSub.prototype.publish).nthCalledWith(1, expectedPayload);
    expect(PubSub.prototype.publish).nthCalledWith(2, expectedPayload);
    expect(PubSub.prototype.publish).nthCalledWith(3, expectedPayload);
  });

  it('should not publish a guess event if the word is empty', () => {
    const controlsRenderer = new ControlsRenderer(true, true);
    const guessButtonElement = controlsRenderer.getElement().querySelector('#guess-button') as HTMLButtonElement;
    const guessInputElement = controlsRenderer.getElement().querySelector('#guess-input') as HTMLInputElement;

    jest.spyOn(PubSub.prototype, 'publish');

    // Set to a string with spaces only to make sure that they are trimmed
    guessInputElement.value = '  ';
    guessButtonElement.click();

    expect(PubSub.prototype.publish).not.toBeCalled();
  });

  it('should show first letters on a click', () => {
    const controlsRenderer = new ControlsRenderer(true, true);
    const showFirstLettersCheckboxElement = controlsRenderer
      .getElement()
      .querySelector('#show-first-letters-checkbox') as HTMLInputElement;

    showFirstLettersCheckboxElement.click();
  });

  test.each([
    { name: 'first letters', selector: '#show-first-letters-checkbox' },
    { name: 'text', selector: '#show-text-checkbox' },
  ])('should toggle $name', ({ selector }) => {
    const controlsRenderer = new ControlsRenderer(true, true);
    const checkboxElement = controlsRenderer.getElement().querySelector(selector) as HTMLInputElement;

    jest.spyOn(PubSub.prototype, 'publish');

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

    expect(PubSub.prototype.publish).nthCalledWith(1, true);
    expect(PubSub.prototype.publish).nthCalledWith(2, false);
    expect(PubSub.prototype.publish).nthCalledWith(3, true);
    expect(PubSub.prototype.publish).nthCalledWith(4, false);
  });

  test.each([
    {
      nameA: 'first letters',
      nameB: 'text',
      selectorA: '#show-first-letters-checkbox',
      selectorB: '#show-text-checkbox',
    },
    {
      nameA: 'text',
      nameB: 'first letters',
      selectorA: '#show-text-checkbox',
      selectorB: '#show-first-letters-checkbox',
    },
  ])('should disable $nameB when $nameA is enabled', ({ selectorA, selectorB }) => {
    const controlsRenderer = new ControlsRenderer(true, true);
    const checkboxA = controlsRenderer.getElement().querySelector(selectorA) as HTMLInputElement;
    const checkboxB = controlsRenderer.getElement().querySelector(selectorB) as HTMLInputElement;

    // Enable one
    checkboxB.dispatchEvent(new Event('change'));

    // Start spying only after checkboxes are set to default values to not seed mocks with redundant calls
    jest.spyOn(PubSub.prototype, 'publish');

    // Enable the other
    checkboxA.dispatchEvent(new Event('change'));

    // Firstly, the changed (clicked) one should be enabled
    expect(PubSub.prototype.publish).nthCalledWith(1, true);
    // Secondly, the other should be disabled
    expect(PubSub.prototype.publish).nthCalledWith(2, false);
  });
});

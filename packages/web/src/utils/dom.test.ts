import { onChangeAndEnter } from './dom';

let inputElement: HTMLInputElement;
const callback = jest.fn();
const enterPressEvent = new KeyboardEvent('keypress', {
  key: 'Enter',
});

describe(onChangeAndEnter, () => {
  beforeEach(() => {
    jest.clearAllMocks();

    inputElement = document.createElement('input');

    onChangeAndEnter(inputElement, callback, { toggleChecked: true });
  });

  it('should call the callback on change', () => {
    const changeEvent = new Event('change');

    inputElement.dispatchEvent(changeEvent);

    expect(callback).toBeCalledWith(changeEvent);
  });

  it('should call the callback on enter press', () => {
    const numpadEnterPressEvent = new KeyboardEvent('keypress', {
      key: 'NumpadEnter',
    });

    inputElement.dispatchEvent(enterPressEvent);
    inputElement.dispatchEvent(numpadEnterPressEvent);

    expect(callback).nthCalledWith(1, enterPressEvent);
    expect(callback).nthCalledWith(2, numpadEnterPressEvent);
  });

  it('should not call the callback on a random key press', () => {
    const keypressEvent = new KeyboardEvent('keypress', {
      key: 'a',
    });

    inputElement.dispatchEvent(keypressEvent);

    expect(callback).not.toBeCalled();
  });

  it('should toggle the checked attribute on enter press', () => {
    expect(inputElement.checked).toBeFalsy();

    inputElement.dispatchEvent(enterPressEvent);

    expect(inputElement.checked).toBeTruthy();
  });
});

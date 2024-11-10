import { beforeEach, describe, expect, it, vi } from 'vitest';

import { onChangeAndEnter } from './dom';

let inputElement: HTMLInputElement;
let callback: () => void;
const enterPressEvent = new KeyboardEvent('keypress', {
  key: 'Enter',
});

describe(onChangeAndEnter, () => {
  beforeEach(() => {
    inputElement = document.createElement('input');
    callback = vi.fn();

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

import { beforeEach, describe, expect, it, vi } from "vitest";

import { onChangeAndEnter, requireElement } from "./dom";

let inputElement: HTMLInputElement;
let callback: () => void;
const enterPressEvent = new KeyboardEvent("keypress", {
  key: "Enter",
});

describe(onChangeAndEnter, () => {
  beforeEach(() => {
    inputElement = document.createElement("input");
    callback = vi.fn<() => void>();

    onChangeAndEnter(inputElement, callback, { toggleChecked: true });
  });

  it("should call the callback on change", () => {
    const changeEvent = new Event("change");

    inputElement.dispatchEvent(changeEvent);

    expect(callback).toHaveBeenCalledWith(changeEvent);
  });

  it("should call the callback on enter press", () => {
    const numpadEnterPressEvent = new KeyboardEvent("keypress", {
      key: "NumpadEnter",
    });

    inputElement.dispatchEvent(enterPressEvent);
    inputElement.dispatchEvent(numpadEnterPressEvent);

    expect(callback).nthCalledWith(1, enterPressEvent);
    expect(callback).nthCalledWith(2, numpadEnterPressEvent);
  });

  it("should not call the callback on a random key press", () => {
    const keypressEvent = new KeyboardEvent("keypress", {
      key: "a",
    });

    inputElement.dispatchEvent(keypressEvent);

    expect(callback).not.toHaveBeenCalled();
  });

  it("should toggle the checked attribute on enter press", () => {
    expect(inputElement.checked).toBeFalsy();

    inputElement.dispatchEvent(enterPressEvent);

    expect(inputElement.checked).toBeTruthy();
  });
});

describe(requireElement, () => {
  const root = document.createElement("div");

  root.innerHTML = '<textarea id="text"></textarea>';

  it("should return the element of the given type", () => {
    expect(requireElement({ root, selector: "#text", type: HTMLTextAreaElement })).toBe(
      root.querySelector("#text"),
    );
  });

  it("should throw when the element is of another type", () => {
    expect(() => requireElement({ root, selector: "#text", type: HTMLInputElement })).toThrow(
      'Expected an instance of HTMLInputElement at "#text"',
    );
  });

  it("should throw when there is no element", () => {
    expect(() => requireElement({ root, selector: "#missing", type: HTMLElement })).toThrow(
      'Expected an instance of HTMLElement at "#missing"',
    );
  });
});

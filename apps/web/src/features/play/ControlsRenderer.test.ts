import { describe, expect, it, vi } from "vitest";

import { ControlsRenderer, getElements } from "./ControlsRenderer";
import { requireElement } from "../../shared/dom";

const typeGuess = (guessInputElement: HTMLInputElement, word: string) => {
  guessInputElement.value = word;
  guessInputElement.dispatchEvent(new Event("input"));
};

const newControlsRenderer = (
  options: { allowShowingFirstLetters?: boolean; allowShowingText?: boolean } = {},
) => {
  const onGuess = vi.fn<(word: string) => void>();
  const onShowFirstLetters = vi.fn<(isShown: boolean) => void>();
  const onShowText = vi.fn<(isShown: boolean) => void>();
  const controlsRenderer = new ControlsRenderer({
    ...options,
    onGuess,
    onShowFirstLetters,
    onShowText,
  });

  return { controlsRenderer, onGuess, onShowFirstLetters, onShowText };
};

describe(ControlsRenderer, () => {
  it("should be initialized with default values", () => {
    const { controlsRenderer } = newControlsRenderer({
      allowShowingFirstLetters: true,
      allowShowingText: true,
    });
    const { showTextCheckboxElement, showFirstLettersCheckboxElement } = getElements(
      controlsRenderer.getElement(),
    );

    expect(showTextCheckboxElement.checked).toBe(false);
    expect(showFirstLettersCheckboxElement.checked).toBe(false);
  });

  it("should be initialized with disabled showing first letters checkbox", () => {
    const { controlsRenderer } = newControlsRenderer({
      allowShowingFirstLetters: false,
      allowShowingText: true,
    });
    const hiddenElements = controlsRenderer.getElement().querySelectorAll(".hide");

    expect(hiddenElements).toHaveLength(1);
    expect(hiddenElements?.[0].querySelector("#show-first-letters-checkbox")).toEqual(
      expect.any(HTMLElement),
    );
  });

  it("should be initialized with disabled showing text checkbox", () => {
    const { controlsRenderer } = newControlsRenderer({
      allowShowingFirstLetters: true,
      allowShowingText: false,
    });
    const hiddenElements = controlsRenderer.getElement().querySelectorAll(".hide");

    expect(hiddenElements).toHaveLength(1);
    expect(hiddenElements?.[0].querySelector("#show-text-checkbox")).toEqual(
      expect.any(HTMLElement),
    );
  });

  it.each([
    { trigger: "a click", submit: (element: HTMLElement) => element.click() },
    {
      trigger: "Enter",
      submit: (element: HTMLElement) =>
        element.dispatchEvent(new KeyboardEvent("keypress", { key: "Enter" })),
    },
    {
      trigger: "NumpadEnter",
      submit: (element: HTMLElement) =>
        element.dispatchEvent(new KeyboardEvent("keypress", { key: "NumpadEnter" })),
    },
  ])(
    "should send a guess with a trimmed word in its typed case on $trigger",
    ({ trigger, submit }) => {
      const { controlsRenderer, onGuess } = newControlsRenderer();
      const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());

      typeGuess(guessInputElement, " TeST# ");
      submit(trigger === "a click" ? guessButtonElement : guessInputElement);

      expect(onGuess).toHaveBeenCalledWith("TeST#");
    },
  );

  it("should keep the guess and the status, focus the input and disable the button while a guess is checked", () => {
    const { controlsRenderer } = newControlsRenderer();
    const { guessButtonElement, guessInputElement, statusElement } = getElements(
      controlsRenderer.getElement(),
    );

    controlsRenderer.announce("No new words for this guess");
    const focus = vi.spyOn(guessInputElement, "focus");
    typeGuess(guessInputElement, "test");

    guessButtonElement.click();

    expect(guessInputElement.value).toBe("test");
    expect(focus).toHaveBeenCalled();
    expect(guessButtonElement.disabled).toBe(true);
    expect(statusElement.textContent).toBe("No new words for this guess");
  });

  it("should empty the input and clear the last status once a guess is found", () => {
    const { controlsRenderer } = newControlsRenderer();
    const { guessButtonElement, guessInputElement, statusElement } = getElements(
      controlsRenderer.getElement(),
    );

    controlsRenderer.announce("No new words for this guess");
    typeGuess(guessInputElement, "test");
    guessButtonElement.click();

    controlsRenderer.acceptGuess("test");

    expect(guessInputElement.value).toBe("");
    expect(guessButtonElement.disabled).toBe(true);
    expect(statusElement.textContent).toBe("");
  });

  it("should keep what was typed or announced while a found guess was checked", () => {
    const { controlsRenderer } = newControlsRenderer();
    const { guessButtonElement, guessInputElement, statusElement } = getElements(
      controlsRenderer.getElement(),
    );

    typeGuess(guessInputElement, "test");
    guessButtonElement.click();
    typeGuess(guessInputElement, "next");
    controlsRenderer.announce("Could not open this word");

    controlsRenderer.acceptGuess("test");

    expect(guessInputElement.value).toBe("next");
    expect(guessButtonElement.disabled).toBe(false);
    expect(statusElement.textContent).toBe("Could not open this word");
  });

  it("should send a guess submitted twice only once", () => {
    const { controlsRenderer, onGuess } = newControlsRenderer();
    const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());

    typeGuess(guessInputElement, "test");

    guessButtonElement.click();
    guessInputElement.dispatchEvent(new KeyboardEvent("keypress", { key: "Enter" }));

    expect(onGuess).toHaveBeenCalledTimes(1);
  });

  it("should not send a guess again while it is checked, after an earlier guess is answered", () => {
    const { controlsRenderer, onGuess } = newControlsRenderer();
    const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());

    typeGuess(guessInputElement, "one");
    guessButtonElement.click();
    typeGuess(guessInputElement, "two");
    guessButtonElement.click();

    controlsRenderer.acceptGuess("one");
    guessInputElement.dispatchEvent(new KeyboardEvent("keypress", { key: "Enter" }));

    expect(guessButtonElement.disabled).toBe(true);
    expect(onGuess).toHaveBeenCalledTimes(2);
  });

  it("should leave a missed guess in the input and enable the button, so the player can correct it", () => {
    const { controlsRenderer } = newControlsRenderer();
    const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());

    typeGuess(guessInputElement, "test");
    guessButtonElement.click();

    controlsRenderer.returnGuess("test");

    expect(guessInputElement.value).toBe("test");
    expect(guessButtonElement.disabled).toBe(false);
  });

  it("should put a missed guess back if the player emptied the input while it was checked", () => {
    const { controlsRenderer } = newControlsRenderer();
    const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());

    typeGuess(guessInputElement, "test");
    guessButtonElement.click();
    typeGuess(guessInputElement, "");

    controlsRenderer.returnGuess("test");

    expect(guessInputElement.value).toBe("test");
    expect(guessButtonElement.disabled).toBe(false);
  });

  it("should keep the word the player typed while the guess was checked", () => {
    const { controlsRenderer } = newControlsRenderer();
    const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());

    typeGuess(guessInputElement, "test");
    guessButtonElement.click();
    typeGuess(guessInputElement, "next");

    controlsRenderer.returnGuess("test");

    expect(guessInputElement.value).toBe("next");
    expect(guessButtonElement.disabled).toBe(false);
  });

  it("should not send a guess if the word is empty", () => {
    const { controlsRenderer, onGuess } = newControlsRenderer({
      allowShowingFirstLetters: true,
      allowShowingText: true,
    });
    const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());

    // The input holds only spaces, so the test also checks that the renderer trims the word.
    guessInputElement.value = "  ";
    guessButtonElement.click();

    expect(onGuess).not.toHaveBeenCalled();
  });

  it.each([
    { type: "first-letters", selector: "#show-first-letters-checkbox" },
    { type: "text", selector: "#show-text-checkbox" },
  ] as const)("should toggle $type", ({ type, selector }) => {
    const { controlsRenderer, onShowFirstLetters, onShowText } = newControlsRenderer({
      allowShowingFirstLetters: true,
      allowShowingText: true,
    });
    const checkboxElement = requireElement({
      root: controlsRenderer.getElement(),
      selector,
      type: HTMLInputElement,
    });

    checkboxElement.dispatchEvent(new Event("change"));
    checkboxElement.dispatchEvent(new Event("change"));
    checkboxElement.dispatchEvent(
      new KeyboardEvent("keypress", {
        key: "Enter",
      }),
    );
    checkboxElement.dispatchEvent(
      new KeyboardEvent("keypress", {
        key: "NumpadEnter",
      }),
    );

    const onShow = type === "first-letters" ? onShowFirstLetters : onShowText;

    expect(onShow).toHaveBeenNthCalledWith(1, true);
    expect(onShow).toHaveBeenNthCalledWith(2, false);
    expect(onShow).toHaveBeenNthCalledWith(3, true);
    expect(onShow).toHaveBeenNthCalledWith(4, false);
  });

  it.each([
    {
      typeA: "first letters",
      typeB: "text",
      selectorA: "#show-first-letters-checkbox",
      selectorB: "#show-text-checkbox",
    },
    {
      typeA: "text",
      typeB: "first letters",
      selectorA: "#show-text-checkbox",
      selectorB: "#show-first-letters-checkbox",
    },
  ] as const)("should disable $typeA when $typeB is enabled", ({ typeA, selectorA, selectorB }) => {
    const { controlsRenderer, onShowFirstLetters, onShowText } = newControlsRenderer({
      allowShowingFirstLetters: true,
      allowShowingText: true,
    });
    const checkboxA = requireElement({
      root: controlsRenderer.getElement(),
      selector: selectorA,
      type: HTMLInputElement,
    });
    const checkboxB = requireElement({
      root: controlsRenderer.getElement(),
      selector: selectorB,
      type: HTMLInputElement,
    });

    checkboxB.dispatchEvent(new Event("change"));

    const onShowA = typeA === "first letters" ? onShowFirstLetters : onShowText;
    const onShowB = typeA === "first letters" ? onShowText : onShowFirstLetters;

    // The test clears the calls only now, so the setup change above is not counted.
    onShowA.mockClear();
    onShowB.mockClear();

    checkboxA.dispatchEvent(new Event("change"));

    expect(onShowA).toHaveBeenNthCalledWith(1, true);
    expect(onShowB).toHaveBeenNthCalledWith(1, false);
  });

  it("should render the guess button disabled initially", () => {
    const { controlsRenderer } = newControlsRenderer();
    const guessButtonElement = requireElement({
      root: controlsRenderer.getElement(),
      selector: "button",
      type: HTMLButtonElement,
    });

    expect(guessButtonElement.disabled).toBe(true);
  });

  it("should enable the guess button on input", () => {
    const { controlsRenderer } = newControlsRenderer();

    const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());

    typeGuess(guessInputElement, " TeST# ");

    expect(guessButtonElement.disabled).toBe(false);
  });

  it("should not enable the guess button on input that consists of spaces only", () => {
    const { controlsRenderer } = newControlsRenderer();
    const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());

    typeGuess(guessInputElement, "   ");

    expect(guessButtonElement.disabled).toBe(true);
  });

  it("should animate the guess button on input that does not exist", async () => {
    const { controlsRenderer } = newControlsRenderer();
    const { guessInputElement } = getElements(controlsRenderer.getElement());
    const hasShakeAndErrorBefore = guessInputElement.classList.contains("shake-and-error");

    controlsRenderer.shakeAndError();

    const hasShakeAndErrorAfterTriggered = guessInputElement.classList.contains("shake-and-error");
    const animationEndDeferred = Promise.withResolvers();

    guessInputElement.addEventListener("animationend", () => {
      animationEndDeferred.resolve(undefined);
    });
    guessInputElement.dispatchEvent(new Event("animationend"));

    await animationEndDeferred.promise;

    expect(hasShakeAndErrorBefore).toBe(false);
    expect(hasShakeAndErrorAfterTriggered).toBe(true);
    expect(guessInputElement.classList.contains("shake-and-error")).toBe(false);
  });

  it("should announce a wrong guess", () => {
    const { controlsRenderer } = newControlsRenderer();
    const { statusElement } = getElements(controlsRenderer.getElement());

    expect(statusElement.textContent).toBe("");

    controlsRenderer.shakeAndError();
    expect(statusElement.textContent).toBe("No new words for this guess");
  });

  it("should show a status on screen under the guess row and announce it to screen readers", () => {
    const { controlsRenderer } = newControlsRenderer();
    const statusElement = requireElement({
      root: controlsRenderer.getElement(),
      selector: '[role="status"]',
      type: HTMLElement,
    });
    const guessContainerElement = requireElement({
      root: controlsRenderer.getElement(),
      selector: "#guess-container",
      type: HTMLElement,
    });

    controlsRenderer.announce("Could not check this guess");

    expect(statusElement.textContent).toBe("Could not check this guess");
    expect(statusElement.classList.contains("visually-hidden")).toBe(false);
    expect(guessContainerElement.nextElementSibling).toBe(statusElement);
  });

  it.each([
    {
      type: "first letters",
      selector: "#show-first-letters-checkbox",
      uncheck: "uncheckFirstLetters",
    },
    { type: "text", selector: "#show-text-checkbox", uncheck: "uncheckText" },
  ] as const)(
    "should uncheck $type without calling back, so the next change turns it on",
    ({ selector, uncheck }) => {
      const { controlsRenderer, onShowFirstLetters, onShowText } = newControlsRenderer({
        allowShowingFirstLetters: true,
        allowShowingText: true,
      });
      const checkboxElement = requireElement({
        root: controlsRenderer.getElement(),
        selector,
        type: HTMLInputElement,
      });

      checkboxElement.dispatchEvent(new Event("change"));
      onShowFirstLetters.mockClear();
      onShowText.mockClear();

      controlsRenderer[uncheck]();

      expect(checkboxElement.checked).toBe(false);
      expect(onShowFirstLetters).not.toHaveBeenCalled();
      expect(onShowText).not.toHaveBeenCalled();

      checkboxElement.dispatchEvent(new Event("change"));

      expect(checkboxElement.checked).toBe(true);
    },
  );
});

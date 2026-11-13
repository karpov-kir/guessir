import { describe, expect, it, vi } from "vitest";

import { PubSub } from "../../shared/PubSub";
import { ControlsRenderer, getElements, GuessEvent } from "./ControlsRenderer";
import { requireElement } from "../../shared/dom";

const typeGuess = (guessInputElement: HTMLInputElement, word: string) => {
  guessInputElement.value = word;
  guessInputElement.dispatchEvent(new Event("input"));
};

describe(ControlsRenderer, () => {
  it("should be initialized with default values", () => {
    const controlsRenderer = new ControlsRenderer({
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
    const controlsRenderer = new ControlsRenderer({
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
    const controlsRenderer = new ControlsRenderer({
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
    "should publish a guess event with a trimmed word in its typed case on $trigger",
    ({ trigger, submit }) => {
      const guessPubSub = new PubSub<GuessEvent>();
      const controlsRenderer = new ControlsRenderer({ guessPubSub });
      const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());

      const publish = vi.spyOn(guessPubSub, "publish");

      typeGuess(guessInputElement, " TeST# ");
      submit(trigger === "a click" ? guessButtonElement : guessInputElement);

      expect(publish).toHaveBeenCalledWith({ word: "TeST#" });
    },
  );

  it("should keep the guess and the status, focus the input and disable the button while a guess is checked", () => {
    const controlsRenderer = new ControlsRenderer();
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
    const controlsRenderer = new ControlsRenderer();
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
    const controlsRenderer = new ControlsRenderer();
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
    const guessPubSub = new PubSub<GuessEvent>();
    const controlsRenderer = new ControlsRenderer({ guessPubSub });
    const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());

    const publish = vi.spyOn(guessPubSub, "publish");
    typeGuess(guessInputElement, "test");

    guessButtonElement.click();
    guessInputElement.dispatchEvent(new KeyboardEvent("keypress", { key: "Enter" }));

    expect(publish).toHaveBeenCalledTimes(1);
  });

  it("should not send a guess again while it is checked, after an earlier guess is answered", () => {
    const guessPubSub = new PubSub<GuessEvent>();
    const controlsRenderer = new ControlsRenderer({ guessPubSub });
    const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());

    const publish = vi.spyOn(guessPubSub, "publish");
    typeGuess(guessInputElement, "one");
    guessButtonElement.click();
    typeGuess(guessInputElement, "two");
    guessButtonElement.click();

    controlsRenderer.acceptGuess("one");
    guessInputElement.dispatchEvent(new KeyboardEvent("keypress", { key: "Enter" }));

    expect(guessButtonElement.disabled).toBe(true);
    expect(publish).toHaveBeenCalledTimes(2);
  });

  it("should leave a missed guess in the input and enable the button, so the player can correct it", () => {
    const controlsRenderer = new ControlsRenderer();
    const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());

    typeGuess(guessInputElement, "test");
    guessButtonElement.click();

    controlsRenderer.returnGuess("test");

    expect(guessInputElement.value).toBe("test");
    expect(guessButtonElement.disabled).toBe(false);
  });

  it("should put a missed guess back if the player emptied the input while it was checked", () => {
    const controlsRenderer = new ControlsRenderer();
    const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());

    typeGuess(guessInputElement, "test");
    guessButtonElement.click();
    typeGuess(guessInputElement, "");

    controlsRenderer.returnGuess("test");

    expect(guessInputElement.value).toBe("test");
    expect(guessButtonElement.disabled).toBe(false);
  });

  it("should keep the word the player typed while the guess was checked", () => {
    const controlsRenderer = new ControlsRenderer();
    const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());

    typeGuess(guessInputElement, "test");
    guessButtonElement.click();
    typeGuess(guessInputElement, "next");

    controlsRenderer.returnGuess("test");

    expect(guessInputElement.value).toBe("next");
    expect(guessButtonElement.disabled).toBe(false);
  });

  it("should not publish a guess event if the word is empty", () => {
    const guessPubSub = new PubSub<GuessEvent>();
    const controlsRenderer = new ControlsRenderer({
      allowShowingFirstLetters: true,
      allowShowingText: true,
      guessPubSub,
    });
    const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());

    const publish = vi.spyOn(guessPubSub, "publish");

    // The input holds only spaces, so the test also checks that the renderer trims the word.
    guessInputElement.value = "  ";
    guessButtonElement.click();

    expect(publish).not.toHaveBeenCalled();
  });

  it.each([
    { type: "first-letters", selector: "#show-first-letters-checkbox" },
    { type: "text", selector: "#show-text-checkbox" },
  ] as const)("should toggle $type", ({ type, selector }) => {
    const showFirstLettersPubSub = new PubSub<boolean>();
    const showTextPubSub = new PubSub<boolean>();
    const controlsRenderer = new ControlsRenderer({
      allowShowingFirstLetters: true,
      allowShowingText: true,
      showFirstLettersPubSub,
      showTextPubSub,
    });
    const checkboxElement = requireElement({
      root: controlsRenderer.getElement(),
      selector,
      type: HTMLInputElement,
    });

    const publishFirstLetters = vi.spyOn(showFirstLettersPubSub, "publish");
    const publishText = vi.spyOn(showTextPubSub, "publish");

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

    const publish = type === "first-letters" ? publishFirstLetters : publishText;

    expect(publish).nthCalledWith(1, true);
    expect(publish).nthCalledWith(2, false);
    expect(publish).nthCalledWith(3, true);
    expect(publish).nthCalledWith(4, false);
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
    const showFirstLettersPubSub = new PubSub<boolean>();
    const showTextPubSub = new PubSub<boolean>();
    const controlsRenderer = new ControlsRenderer({
      allowShowingFirstLetters: true,
      allowShowingText: true,
      showFirstLettersPubSub,
      showTextPubSub,
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

    const pubSubA = typeA === "first letters" ? showFirstLettersPubSub : showTextPubSub;
    const pubSubB = typeA === "first letters" ? showTextPubSub : showFirstLettersPubSub;

    // The test spies only now, so the setup change above is not counted.
    const publishA = vi.spyOn(pubSubA, "publish");
    const publishB = vi.spyOn(pubSubB, "publish");

    checkboxA.dispatchEvent(new Event("change"));

    expect(publishA).nthCalledWith(1, true);
    expect(publishB).nthCalledWith(1, false);
  });

  it("should render the guess button disabled initially", () => {
    const controlsRenderer = new ControlsRenderer();
    const guessButtonElement = requireElement({
      root: controlsRenderer.getElement(),
      selector: "button",
      type: HTMLButtonElement,
    });

    expect(guessButtonElement.disabled).toBe(true);
  });

  it("should enable the guess button on input", () => {
    const controlsRenderer = new ControlsRenderer();

    const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());

    typeGuess(guessInputElement, " TeST# ");

    expect(guessButtonElement.disabled).toBe(false);
  });

  it("should not enable the guess button on input that consists of spaces only", () => {
    const controlsRenderer = new ControlsRenderer();
    const { guessButtonElement, guessInputElement } = getElements(controlsRenderer.getElement());

    typeGuess(guessInputElement, "   ");

    expect(guessButtonElement.disabled).toBe(true);
  });

  it("should animate the guess button on input that does not exist", async () => {
    const controlsRenderer = new ControlsRenderer();
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
    const controlsRenderer = new ControlsRenderer();
    const { statusElement } = getElements(controlsRenderer.getElement());

    expect(statusElement.textContent).toBe("");

    controlsRenderer.shakeAndError();
    expect(statusElement.textContent).toBe("No new words for this guess");
  });

  it("should show a status on screen under the guess row and announce it to screen readers", () => {
    const controlsRenderer = new ControlsRenderer();
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
    "should uncheck $type without publishing, so the next change turns it on",
    ({ selector, uncheck }) => {
      const showFirstLettersPubSub = new PubSub<boolean>();
      const showTextPubSub = new PubSub<boolean>();
      const controlsRenderer = new ControlsRenderer({
        allowShowingFirstLetters: true,
        allowShowingText: true,
        showFirstLettersPubSub,
        showTextPubSub,
      });
      const checkboxElement = requireElement({
        root: controlsRenderer.getElement(),
        selector,
        type: HTMLInputElement,
      });

      checkboxElement.dispatchEvent(new Event("change"));
      const publishFirstLetters = vi.spyOn(showFirstLettersPubSub, "publish");
      const publishText = vi.spyOn(showTextPubSub, "publish");

      controlsRenderer[uncheck]();

      expect(checkboxElement.checked).toBe(false);
      expect(publishFirstLetters).not.toHaveBeenCalled();
      expect(publishText).not.toHaveBeenCalled();

      checkboxElement.dispatchEvent(new Event("change"));

      expect(checkboxElement.checked).toBe(true);
    },
  );
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import { LocalGame } from "../../entities/game/exports";
import { PlayController } from "./PlayController";
import { Logger, LogLevel } from "../../shared/Logger";
import { requireElement } from "../../shared/dom";

// Silences the logger: these tests make the game fail to answer on purpose.
Logger.root.setLevel(LogLevel.Silent);

let game: LocalGame;
let gameElement: HTMLElement;

/** Lets the game answers, which are promises, reach the renderers. */
const settle = () => new Promise((resolve) => setTimeout(resolve));
const getElement = (selector: string) =>
  requireElement({ root: gameElement, selector, type: HTMLElement });
const getStatus = () => gameElement.querySelector("#guess-status")?.textContent;
const getScore = () => gameElement.querySelector("#current-score")?.textContent;
const getGuessInput = () =>
  requireElement({ root: gameElement, selector: "#guess-input", type: HTMLInputElement });
const isGuessInputShaken = () => getGuessInput().classList.contains("shake-and-error");
const getCheckbox = (selector: string) =>
  requireElement({ root: gameElement, selector, type: HTMLInputElement });
const toggleCheckbox = (selector: string) =>
  getCheckbox(selector).dispatchEvent(new Event("change"));
const typeGuess = (word: string) => {
  getGuessInput().value = word;
  getGuessInput().dispatchEvent(new Event("input"));
};
const submitGuess = (word: string) => {
  typeGuess(word);
  requireElement({
    root: gameElement,
    selector: "#guess-button",
    type: HTMLButtonElement,
  }).click();
};
const clickWord = (wordIndex: number) =>
  gameElement.querySelectorAll<HTMLButtonElement>(".lexeme-container")[wordIndex].click();
const getTextClasses = () => getElement("#text-container").classList;
const getWordTexts = () =>
  Array.from(getElement("#text-container").querySelectorAll(".lexeme")).map(
    (element) => element.textContent,
  );

describe(PlayController, () => {
  beforeEach(() => {
    game = new LocalGame({
      title: "Title",
      text: "One two",
      allowShowingFirstLetters: true,
      allowShowingText: true,
    });

    gameElement = new PlayController({ game }).getElement();
  });

  it("should render the skeleton of the game into the game element", () => {
    expect(gameElement.id).toBe("game");
    expect(gameElement.querySelector("#title")?.textContent).toBe("Title");
    expect(gameElement.querySelectorAll(".lexeme-container")).toHaveLength(2);
    expect(gameElement.querySelector("#total-score")?.textContent).toBe("2");
  });

  it("should put the score and the controls together above the text", () => {
    const hudElement = getElement("#hud");

    expect(hudElement.contains(getElement("#score-container"))).toBe(true);
    expect(hudElement.contains(getElement("#controls-container"))).toBe(true);
    expect(hudElement.nextElementSibling).toBe(getElement("#text-container"));
  });

  it("should reveal a clicked word and increase the score once", async () => {
    clickWord(0);
    clickWord(0);
    await settle();

    expect(getWordTexts()[0]).toBe("One");
    expect(getScore()).toBe("1");
  });

  it("should announce a word that could not be revealed", async () => {
    vi.spyOn(game, "reveal").mockRejectedValue(new Error("Test"));

    clickWord(0);
    await settle();

    expect(getStatus()).toBe("Could not open this word");
    expect(getScore()).toBe("0");
  });

  it("should increase the score if the user guesses a word", async () => {
    submitGuess("one");
    await settle();

    expect(getWordTexts()[0]).toBe("One");
    expect(getScore()).toBe("1");
    expect(getGuessInput().value).toBe("");
  });

  it("should shake the guess input and keep the score when the user does not guess the word", async () => {
    submitGuess("unknown");
    await settle();

    expect(getScore()).toBe("0");
    expect(isGuessInputShaken()).toBe(true);
    expect(getStatus()).toBe("No new words for this guess");
    expect(getGuessInput().value).toBe("unknown");
  });

  it("should announce a guess that could not be checked, without counting it as a miss", async () => {
    vi.spyOn(game, "guess").mockRejectedValue(new Error("Test"));

    submitGuess("one");
    await settle();

    expect(getStatus()).toBe("Could not check this guess");
    expect(isGuessInputShaken()).toBe(false);
    expect(getGuessInput().value).toBe("one");
    expect(getScore()).toBe("0");
  });

  it.each([
    { outcome: "a miss", word: "unknown", mockGuess: () => undefined },
    {
      outcome: "a failure",
      word: "one",
      mockGuess: () => vi.spyOn(game, "guess").mockRejectedValue(new Error("Test")),
    },
  ])(
    "should keep the guess in the input while it is checked and after $outcome",
    async ({ word, mockGuess }) => {
      mockGuess();

      submitGuess(word);
      // The test checks the input before the server answers. An emptied input would show its
      // placeholder for as long as the server takes to answer.
      expect(getGuessInput().value).toBe(word);
      await settle();

      expect(getGuessInput().value).toBe(word);
    },
  );

  it("should empty the input once a guess is found", async () => {
    submitGuess("one");
    expect(getGuessInput().value).toBe("one");
    await settle();

    expect(getGuessInput().value).toBe("");
  });

  it.each([
    { outcome: "a hit", word: "one", mockGuess: () => undefined },
    { outcome: "a miss", word: "unknown", mockGuess: () => undefined },
    {
      outcome: "a failure",
      word: "one",
      mockGuess: () => vi.spyOn(game, "guess").mockRejectedValue(new Error("Test")),
    },
  ])(
    "should keep the word the player typed while the guess was checked, after $outcome",
    async ({ word, mockGuess }) => {
      mockGuess();

      submitGuess(word);
      typeGuess("two");
      await settle();

      expect(getGuessInput().value).toBe("two");
    },
  );

  it("should keep a status announced while a hit was checked", async () => {
    const guess = game.guess.bind(game);
    const guessAnswer = Promise.withResolvers<undefined>();

    vi.spyOn(game, "guess").mockImplementationOnce(async (word) => {
      await guessAnswer.promise;

      return guess(word);
    });
    vi.spyOn(game, "reveal").mockRejectedValue(new Error("Test"));

    submitGuess("one");
    clickWord(1);
    await settle();

    expect(getStatus()).toBe("Could not open this word");

    guessAnswer.resolve(undefined);
    await settle();

    expect(getStatus()).toBe("Could not open this word");
  });

  it("should load the first letters once and show them", async () => {
    const firstLetters = vi.spyOn(game, "firstLetters");

    toggleCheckbox("#show-first-letters-checkbox");
    await settle();

    expect(getTextClasses()).toContain("show-first-letters");
    expect(getElement("#text-container").querySelector(".lexeme-first-letter")?.textContent).toBe(
      "O",
    );

    toggleCheckbox("#show-first-letters-checkbox");
    expect(getTextClasses()).not.toContain("show-first-letters");

    toggleCheckbox("#show-first-letters-checkbox");
    await settle();

    expect(getTextClasses()).toContain("show-first-letters");
    expect(firstLetters).toHaveBeenCalledTimes(1);
    expect(getScore()).toBe("0");
  });

  it("should load the words once and let the user peek at them", async () => {
    const words = vi.spyOn(game, "words");

    toggleCheckbox("#show-text-checkbox");
    await settle();

    expect(getTextClasses()).toContain("show-text");
    expect(getWordTexts()).toEqual(["One", "two"]);

    toggleCheckbox("#show-text-checkbox");
    expect(getTextClasses()).not.toContain("show-text");

    toggleCheckbox("#show-text-checkbox");
    await settle();

    expect(words).toHaveBeenCalledTimes(1);
    expect(getScore()).toBe("0");
  });

  it.each([
    {
      hint: "first letters",
      load: "firstLetters",
      checkbox: "#show-first-letters-checkbox",
      status: "Could not load first letters",
    },
    {
      hint: "text",
      load: "words",
      checkbox: "#show-text-checkbox",
      status: "Could not load the text",
    },
  ] as const)(
    "should uncheck $hint and announce it when they fail to load",
    async ({ load, checkbox, status }) => {
      vi.spyOn(game, load).mockRejectedValueOnce(new Error("Test"));

      toggleCheckbox(checkbox);
      expect(getCheckbox(checkbox).checked).toBe(true);
      await settle();

      expect(getCheckbox(checkbox).checked).toBe(false);
      expect(getStatus()).toBe(status);
      expect(getTextClasses()).not.toContain("show-first-letters");
      expect(getTextClasses()).not.toContain("show-text");

      toggleCheckbox(checkbox);
      await settle();

      expect(game[load]).toHaveBeenCalledTimes(2);
    },
  );

  it("should not turn on a hint the user turned off while it loaded", async () => {
    toggleCheckbox("#show-first-letters-checkbox");
    toggleCheckbox("#show-first-letters-checkbox");
    toggleCheckbox("#show-text-checkbox");
    toggleCheckbox("#show-text-checkbox");
    await settle();

    expect(getTextClasses()).not.toContain("show-first-letters");
    expect(getTextClasses()).not.toContain("show-text");
  });

  it("should not announce the failure of a hint the user left while it loaded", async () => {
    vi.spyOn(game, "firstLetters").mockRejectedValue(new Error("Test"));

    toggleCheckbox("#show-first-letters-checkbox");
    toggleCheckbox("#show-text-checkbox");
    await settle();

    expect(getStatus()).toBe("");
    expect(getCheckbox("#show-text-checkbox").checked).toBe(true);
    expect(getTextClasses()).toContain("show-text");
  });
});

import arrowIcon from "../icons/arrowIcon.svg?raw";
import { PubSub } from "../pubSub/PubSub";
import { onChangeAndEnter, onEnter, requireElement } from "../utils/dom";
import { icon } from "../utils/icon";
import { ChildRenderer } from "./types";

export type GuessEvent = {
  word: string;
};

type ControlsRendererOptions = {
  allowShowingText?: boolean;
  allowShowingFirstLetters?: boolean;
  guessPubSub?: PubSub<GuessEvent>;
  showFirstLettersPubSub?: PubSub<boolean>;
  showTextPubSub?: PubSub<boolean>;
};

export class ControlsRenderer implements ChildRenderer {
  private readonly containerElement: HTMLElement;
  private readonly guessPubSub: PubSub<GuessEvent>;
  private readonly showFirstLettersPubSub: PubSub<boolean>;
  private readonly showTextPubSub: PubSub<boolean>;
  private isTextShown = false;
  private isFirstLettersShown = false;
  /**
   * Maps each word the server is checking to the status shown when the word was sent. A second
   * click on a checked word sends nothing. A hit clears the status only while it is still the one
   * shown at send.
   */
  private readonly statusesByCheckedWord = new Map<string, string>();

  public readonly guessEvent: PubSub<GuessEvent>["event"];
  public readonly showFirstLettersEvent: PubSub<boolean>["event"];
  public readonly showTextEvent: PubSub<boolean>["event"];

  constructor(options: ControlsRendererOptions = {}) {
    this.guessPubSub = options.guessPubSub || new PubSub<GuessEvent>();
    this.showFirstLettersPubSub = options.showFirstLettersPubSub || new PubSub<boolean>();
    this.showTextPubSub = options.showTextPubSub || new PubSub<boolean>();

    this.guessEvent = this.guessPubSub.event;
    this.showFirstLettersEvent = this.showFirstLettersPubSub.event;
    this.showTextEvent = this.showTextPubSub.event;

    this.containerElement = document.createElement("div");
    this.containerElement.id = "controls-container";
    this.initElement(options.allowShowingText, options.allowShowingFirstLetters);
  }

  public getElement(): HTMLElement {
    return this.containerElement;
  }

  /**
   * Empties the input for the next word after a hit. Also clears the status, while it still reads
   * as it did when the word was sent. A word the player typed since sending stays.
   */
  public acceptGuess(word: string) {
    const { guessInputElement, statusElement } = this.getElements();

    const statusAtSend = this.statusesByCheckedWord.get(word);

    this.statusesByCheckedWord.delete(word);

    if (this.getInputtedWord() === word) {
      guessInputElement.value = "";
    }

    if (statusElement.textContent === statusAtSend) {
      statusElement.textContent = "";
    }

    this.renderGuessButton();
  }

  /**
   * Leaves a missed or unchecked guess in the input, so the player can correct it, and puts it back
   * if the player emptied the input meanwhile. A word typed since sending stays.
   */
  public returnGuess(word: string) {
    const { guessInputElement } = this.getElements();

    this.statusesByCheckedWord.delete(word);

    if (!this.getInputtedWord()) {
      guessInputElement.value = word;
    }

    this.renderGuessButton();
  }

  /** Shows the status on screen in the live region, which screen readers also read out. */
  public announce(status: string) {
    const { statusElement } = this.getElements();

    statusElement.textContent = status;
  }

  /** Unchecks the first letters hint without publishing, for a hint that could not turn on. */
  public uncheckFirstLetters() {
    const { showFirstLettersCheckboxElement } = this.getElements();

    this.isFirstLettersShown = false;
    showFirstLettersCheckboxElement.checked = false;
  }

  /** Unchecks the text hint without publishing, for a hint that could not turn on. */
  public uncheckText() {
    const { showTextCheckboxElement } = this.getElements();

    this.isTextShown = false;
    showTextCheckboxElement.checked = false;
  }

  /** Shakes the input in error and announces the miss, for a guess that revealed no new words. */
  public shakeAndError() {
    const { guessInputElement } = this.getElements();

    guessInputElement.classList.add("shake-and-error");
    // The shake is visual only, so a screen reader hears the miss from this live region
    this.announce("No new words for this guess");

    const removeAnimationClass = () => {
      guessInputElement.removeEventListener("animationend", removeAnimationClass);
      guessInputElement.classList.remove("shake-and-error");
    };

    guessInputElement.addEventListener("animationend", removeAnimationClass);
  }

  private initElement(allowShowingText?: boolean, allowShowingFirstLetters?: boolean) {
    this.containerElement.innerHTML = `
      <div id="guess-container">
        <label for="guess-input" class="visually-hidden">Your guess</label>
        <input id="guess-input" type="text" placeholder="Type a word" autocomplete="off" autocapitalize="off" spellcheck="false" />
        <button title="Please, input at least one letter to try to guess!" disabled id="guess-button" type="button">
          Guess ${icon(arrowIcon)}
        </button>
      </div>
      <div id="guess-status" role="status"></div>
      <div id="hints" role="group" aria-labelledby="hints-label">
        <span id="hints-label">Hints:</span>
        <label class="chip">
          <input type="checkbox" id="show-first-letters-checkbox"> First letters
        </label>
        <label class="chip">
          <input type="checkbox" id="show-text-checkbox" /> Peek at text
        </label>
      </div>
    `;

    const { showTextCheckboxElement, showFirstLettersCheckboxElement } = this.getElements();

    if (!allowShowingText) {
      showTextCheckboxElement.parentElement?.classList.add("hide");
    }

    if (!allowShowingFirstLetters) {
      showFirstLettersCheckboxElement.parentElement?.classList.add("hide");
    }

    this.attachGuessHandler();
    this.attachShowFirstLettersHandler();
    this.attachShowTextHandler();
    this.attachInputHandler();
  }

  private getElements() {
    return getElements(this.containerElement);
  }

  /**
   * Returns the typed word without surrounding spaces, in its typed case: the game ignores case
   * when it matches.
   */
  private getInputtedWord() {
    const { guessInputElement } = this.getElements();

    return guessInputElement.value.trim();
  }

  private attachInputHandler() {
    const { guessInputElement } = this.getElements();

    guessInputElement.addEventListener("input", () => this.renderGuessButton());
  }

  /** Enables the button for a typed word that is not already being checked. */
  private renderGuessButton() {
    const { guessButtonElement } = this.getElements();
    const word = this.getInputtedWord();

    guessButtonElement.disabled = !word || this.statusesByCheckedWord.has(word);
  }

  private attachGuessHandler() {
    const { guessButtonElement, guessInputElement, statusElement } = this.getElements();
    const guessHandler = () => {
      const word = this.getInputtedWord();

      if (!word || this.statusesByCheckedWord.has(word)) {
        return;
      }

      // The word stays in the input while the server checks it: an emptied input would flash its
      // placeholder
      this.statusesByCheckedWord.set(word, statusElement.textContent ?? "");
      this.renderGuessButton();
      guessInputElement.focus();
      this.guessPubSub.publish({
        word,
      });
    };

    guessButtonElement.addEventListener("click", guessHandler);
    onEnter(guessInputElement, guessHandler);
  }

  private attachShowTextHandler() {
    const { showTextCheckboxElement, showFirstLettersCheckboxElement } = this.getElements();

    onChangeAndEnter(showTextCheckboxElement, () => {
      if (this.isFirstLettersShown) {
        showFirstLettersCheckboxElement.dispatchEvent(new Event("change"));
      }

      this.isTextShown = !this.isTextShown;
      showTextCheckboxElement.checked = this.isTextShown;
      this.showTextPubSub.publish(this.isTextShown);
    });
  }

  private attachShowFirstLettersHandler() {
    const { showTextCheckboxElement, showFirstLettersCheckboxElement } = this.getElements();

    onChangeAndEnter(showFirstLettersCheckboxElement, () => {
      if (this.isTextShown) {
        showTextCheckboxElement.dispatchEvent(new Event("change"));
      }

      this.isFirstLettersShown = !this.isFirstLettersShown;
      showFirstLettersCheckboxElement.checked = this.isFirstLettersShown;
      this.showFirstLettersPubSub.publish(this.isFirstLettersShown);
    });
  }
}

export function getElements(containerElement: HTMLElement) {
  const showTextCheckboxElement = requireElement({
    root: containerElement,
    selector: "#show-text-checkbox",
    type: HTMLInputElement,
  });
  const showFirstLettersCheckboxElement = requireElement({
    root: containerElement,
    selector: "#show-first-letters-checkbox",
    type: HTMLInputElement,
  });
  const guessButtonElement = requireElement({
    root: containerElement,
    selector: "#guess-button",
    type: HTMLButtonElement,
  });
  const guessInputElement = requireElement({
    root: containerElement,
    selector: "#guess-input",
    type: HTMLInputElement,
  });
  const statusElement = requireElement({
    root: containerElement,
    selector: "#guess-status",
    type: HTMLElement,
  });

  return {
    showTextCheckboxElement,
    showFirstLettersCheckboxElement,
    guessButtonElement,
    guessInputElement,
    statusElement,
  };
}

import arrowIcon from '../icons/arrowIcon.svg?raw';
import { PubSub } from '../pubSub/PubSub';
import { onChangeAndEnter, onEnter } from '../utils/dom';
import { ChildRenderer } from './types';

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

  public readonly guessEvent: PubSub<GuessEvent>['event'];
  public readonly showFirstLettersEvent: PubSub<boolean>['event'];
  public readonly showTextEvent: PubSub<boolean>['event'];

  constructor(options: ControlsRendererOptions = {}) {
    this.guessPubSub = options.guessPubSub || new PubSub<GuessEvent>();
    this.showFirstLettersPubSub = options.showFirstLettersPubSub || new PubSub<boolean>();
    this.showTextPubSub = options.showTextPubSub || new PubSub<boolean>();

    this.guessEvent = this.guessPubSub.event;
    this.showFirstLettersEvent = this.showFirstLettersPubSub.event;
    this.showTextEvent = this.showTextPubSub.event;

    this.containerElement = document.createElement('div');
    this.containerElement.id = 'controls-container';
    this.initElement(options.allowShowingText, options.allowShowingFirstLetters);
  }

  public getElement(): HTMLElement {
    return this.containerElement;
  }

  /**
   * Puts a missed or unchecked guess back into the empty input, so the player can correct it. The server checks a
   * guess while the player may already type the next word, so a word typed since then stays.
   */
  public returnGuess(word: string) {
    const { guessInputElement, guessButtonElement } = this.getElements();

    if (this.getInputtedWord()) {
      return;
    }

    guessInputElement.value = word;
    guessButtonElement.disabled = false;
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

  /** Unchecks the peek hint without publishing, for a hint that could not turn on. */
  public uncheckText() {
    const { showTextCheckboxElement } = this.getElements();

    this.isTextShown = false;
    showTextCheckboxElement.checked = false;
  }

  /** Shakes the input in error and announces the miss, for a guess that revealed no new words. */
  public shakeAndError() {
    const { guessInputElement } = this.getElements();

    guessInputElement.classList.add('shake-and-error');
    // The shake is visual only, so a screen reader hears the miss from this live region
    this.announce('No new words for this guess');

    const removeAnimationClass = () => {
      guessInputElement.removeEventListener('animationend', removeAnimationClass);
      guessInputElement.classList.remove('shake-and-error');
    };

    guessInputElement.addEventListener('animationend', removeAnimationClass);
  }

  private initElement(allowShowingText?: boolean, allowShowingFirstLetters?: boolean) {
    this.containerElement.innerHTML = `
      <div id="guess-container">
        <label for="guess-input" class="visually-hidden">Your guess</label>
        <input id="guess-input" type="text" placeholder="Type a word" autocomplete="off" autocapitalize="off" spellcheck="false" />
        <button title="Please, input at least one letter to try to guess!" disabled id="guess-button" type="button">
          Guess ${arrowIcon}
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
      showTextCheckboxElement.parentElement?.classList.add('hide');
    }

    if (!allowShowingFirstLetters) {
      showFirstLettersCheckboxElement.parentElement?.classList.add('hide');
    }

    this.attachGuessHandler();
    this.attachShowFirstLettersHandler();
    this.attachShowTextHandler();
    this.attachInputHandler();
  }

  private getElements() {
    return getElements(this.containerElement);
  }

  /** Returns the typed word without surrounding spaces, in its typed case: the game ignores case when it matches. */
  private getInputtedWord() {
    const { guessInputElement } = this.getElements();

    return guessInputElement.value.trim();
  }

  private attachInputHandler() {
    const { guessInputElement, guessButtonElement } = this.getElements();

    guessInputElement.addEventListener('input', () => {
      guessButtonElement.disabled = !this.getInputtedWord();
    });
  }

  /** Empties and focuses the input for the next word, disables the button and clears the status of the last guess. */
  private clearGuessInput() {
    const { guessInputElement, guessButtonElement, statusElement } = this.getElements();

    guessInputElement.value = '';
    guessInputElement.focus();
    guessButtonElement.disabled = true;
    statusElement.textContent = '';
  }

  private attachGuessHandler() {
    const { guessButtonElement, guessInputElement } = this.getElements();
    const guessHandler = () => {
      const word = this.getInputtedWord();

      if (!word) {
        return;
      }

      this.clearGuessInput();
      this.guessPubSub.publish({
        word,
      });
    };

    guessButtonElement.addEventListener('click', guessHandler);
    onEnter(guessInputElement, guessHandler);
  }

  private attachShowTextHandler() {
    const { showTextCheckboxElement, showFirstLettersCheckboxElement } = this.getElements();

    onChangeAndEnter(showTextCheckboxElement, () => {
      if (this.isFirstLettersShown) {
        showFirstLettersCheckboxElement.dispatchEvent(new Event('change'));
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
        showTextCheckboxElement.dispatchEvent(new Event('change'));
      }

      this.isFirstLettersShown = !this.isFirstLettersShown;
      showFirstLettersCheckboxElement.checked = this.isFirstLettersShown;
      this.showFirstLettersPubSub.publish(this.isFirstLettersShown);
    });
  }
}

export function getElements(containerElement: HTMLElement) {
  const showTextCheckboxElement = containerElement.querySelector('#show-text-checkbox') as HTMLInputElement;
  const showFirstLettersCheckboxElement = containerElement.querySelector(
    '#show-first-letters-checkbox',
  ) as HTMLInputElement;
  const guessButtonElement = containerElement.querySelector('#guess-button') as HTMLButtonElement;
  const guessInputElement = containerElement.querySelector('#guess-input') as HTMLInputElement;
  const statusElement = containerElement.querySelector('#guess-status') as HTMLElement;

  return {
    showTextCheckboxElement,
    showFirstLettersCheckboxElement,
    guessButtonElement,
    guessInputElement,
    statusElement,
  };
}

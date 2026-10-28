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

  /** Empties and focuses the guess input, disables the guess button and clears the status message. */
  public clearAndFocusGuessInput() {
    const { guessInputElement, guessButtonElement, statusElement } = this.getElements();

    guessInputElement.value = '';
    guessInputElement.focus();
    guessButtonElement.disabled = true;
    statusElement.textContent = '';
  }

  public shakeAndError() {
    const { guessInputElement, statusElement } = this.getElements();

    guessInputElement.classList.add('shake-and-error');
    // The shake is visual only, so a screen reader hears the miss from this live region
    statusElement.textContent = 'No new words for this guess';

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
        <div id="guess-status" class="visually-hidden" role="status"></div>
      </div>
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
    const showTextCheckboxElement = this.containerElement.querySelector('#show-text-checkbox') as HTMLInputElement;
    const showFirstLettersCheckboxElement = this.containerElement.querySelector(
      '#show-first-letters-checkbox',
    ) as HTMLInputElement;
    const guessButtonElement = this.containerElement.querySelector('#guess-button') as HTMLButtonElement;
    const guessInputElement = this.containerElement.querySelector('#guess-input') as HTMLInputElement;
    const statusElement = this.containerElement.querySelector('#guess-status') as HTMLElement;

    return {
      showTextCheckboxElement,
      showFirstLettersCheckboxElement,
      guessButtonElement,
      guessInputElement,
      statusElement,
    };
  }

  private getInputtedWord() {
    const { guessInputElement } = this.getElements();

    return guessInputElement.value.trim().toLowerCase();
  }

  private attachInputHandler() {
    const { guessInputElement, guessButtonElement } = this.getElements();

    guessInputElement.addEventListener('input', () => {
      if (this.getInputtedWord()) {
        guessButtonElement.disabled = false;
      } else {
        guessButtonElement.disabled = true;
      }
    });
  }

  private attachGuessHandler() {
    const { guessButtonElement, guessInputElement } = this.getElements();
    const guessHandler = () => {
      const word = this.getInputtedWord();

      if (!word) {
        return;
      }

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

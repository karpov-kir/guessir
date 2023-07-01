import { PubSub } from '../pubSub/PubSub';
import { onChangeAndEnter, onEnter } from '../utils/dom';
import { ChildrenRenderer } from './types';

export type GuessEvent = {
  word: string;
};

type ControlsRendererOptions = {
  allowShowingText?: boolean;
  allowShowingFirstLetters?: boolean;
};

export class ControlsRenderer implements ChildrenRenderer {
  private containerElement: HTMLElement;
  private guessPubSub = new PubSub<GuessEvent>();
  private showFirstLettersPubSub = new PubSub<boolean>();
  private showTextPubSub = new PubSub<boolean>();
  private isTextShown = false;
  private isFirstLettersShown = false;

  public readonly guessEvent = this.guessPubSub.event;
  public readonly showFirstLettersEvent = this.showFirstLettersPubSub.event;
  public readonly showTextEvent = this.showTextPubSub.event;

  constructor(options: ControlsRendererOptions = {}) {
    const { allowShowingFirstLetters, allowShowingText } = options;

    this.containerElement = document.createElement('div');
    this.containerElement.id = 'controls-container';
    this.initElement(allowShowingText, allowShowingFirstLetters);
  }

  public getElement(): HTMLElement {
    return this.containerElement;
  }

  // istanbul ignore next: no logic
  public clearAndFocusGuessInput() {
    const { guessInputElement, guessButtonElement } = this.getElements();

    guessInputElement.value = '';
    guessInputElement.focus();
    guessButtonElement.disabled = true;
  }

  public shakeAndError() {
    const { guessInputElement } = this.getElements();

    guessInputElement.classList.add('shake-and-error');

    const removeAnimationClass = () => {
      guessInputElement.removeEventListener('animationend', removeAnimationClass);
      guessInputElement.classList.remove('shake-and-error');
    };

    guessInputElement.addEventListener('animationend', removeAnimationClass);
  }

  private initElement(allowShowingText?: boolean, allowShowingFirstLetters?: boolean) {
    this.containerElement.innerHTML = `
      <input id="guess-input" type="text" />
      <button title="Please, input at least one letter to try to guess!" disabled id="guess-button" type="button">Guess</button>
      <label>
        <input type="checkbox" id="show-text-checkbox" /> Show text
      </label>
      <label>
        <input type="checkbox" id="show-first-letters-checkbox"> Show first letters
      </label>
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

    return { showTextCheckboxElement, showFirstLettersCheckboxElement, guessButtonElement, guessInputElement };
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

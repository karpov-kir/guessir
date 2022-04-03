import { PubSub } from '../pubSub';
import { onChangeAndEnter, onEnter } from '../utils';
import { ChildrenRenderer } from './types';

export type GuessEvent = {
  word: string;
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

  constructor(allowShowingText: boolean, allowShowingFirstLetters: boolean) {
    this.containerElement = document.createElement('div');
    this.containerElement.id = 'controls-container';
    this.initElement(allowShowingText, allowShowingFirstLetters);
  }

  public getElement(): HTMLElement {
    return this.containerElement;
  }

  // istanbul ignore next: no logic
  public cleanAndFocusGuessInput() {
    const { guessInputElement } = this.getElements();

    guessInputElement.value = '';
    guessInputElement.focus();
  }

  private initElement(allowShowingText: boolean, allowShowingFirstLetters: boolean) {
    this.containerElement.innerHTML = `
      <input id="guess-input" type="text" />
      <button id="guess-button" type="button">Guess</button>
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

  private attachGuessHandler() {
    const { guessButtonElement, guessInputElement } = this.getElements();
    const guessHandler = () => {
      const word = guessInputElement.value.trim().toLowerCase();

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

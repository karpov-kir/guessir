import { PubSub } from '../../pubSub/PubSub';
import { ChildRenderer } from '../types';

export enum WordHint {
  None = 'none',
  FirstLetters = 'first-letters',
  Text = 'text',
}

type WordRendererOptions = {
  index: number;
  length: number;
};

export class WordRenderer implements ChildRenderer {
  private readonly index: number;
  private readonly length: number;
  private readonly containerElement: HTMLElement;
  private readonly lexemeElement: HTMLElement;
  private readonly firstLetterElement: HTMLElement;
  private readonly revealRequestPubSub = new PubSub<number>();

  private hint = WordHint.None;
  private firstLetter?: string;

  public isShown = false;
  /** Publishes the lexeme index when the user clicks the word while it is hidden. */
  public readonly revealRequestEvent = this.revealRequestPubSub.event;

  constructor(options: WordRendererOptions) {
    this.index = options.index;
    this.length = options.length;
    this.containerElement = document.createElement('button');
    this.containerElement.classList.add('lexeme-container');
    this.lexemeElement = document.createElement('span');
    this.lexemeElement.classList.add('lexeme');
    this.firstLetterElement = document.createElement('span');
    this.firstLetterElement.classList.add('lexeme-first-letter');

    this.initElement();
  }

  public getElement() {
    return this.containerElement;
  }

  public show(word: string) {
    this.setWord(word);
    this.isShown = true;
    this.containerElement.classList.add('show');
    this.renderLabel();
  }

  /** Puts the word into the tile without showing it, so the text hint can show it. */
  public setWord(word: string) {
    this.lexemeElement.textContent = word;
  }

  public setFirstLetter(firstLetter: string) {
    this.firstLetter = firstLetter;
    this.firstLetterElement.textContent = firstLetter;
    this.renderLabel();
  }

  /** Turns on or off the highlight that marks the word as part of the last successful guess. */
  public markFresh(isFresh: boolean) {
    this.containerElement.classList.toggle('fresh', isFresh);
  }

  public setHint(hint: WordHint) {
    this.hint = hint;
    this.renderLabel();
  }

  /**
   * Names the word for screen readers by what the current hint shows, and drops the name once the word is visible.
   * The hidden placeholder is invisible, so a screen reader would otherwise announce an empty button.
   */
  private renderLabel() {
    if (this.isShown || this.hint === WordHint.Text) {
      this.containerElement.removeAttribute('aria-label');
    } else if (this.hint === WordHint.FirstLetters && this.firstLetter) {
      this.containerElement.setAttribute(
        'aria-label',
        `Hidden word starting with ${this.firstLetter}, ${this.length} letters`,
      );
    } else {
      this.containerElement.setAttribute('aria-label', `Hidden word, ${this.length} letters`);
    }
  }

  private initElement() {
    this.renderLabel();

    // The page font is monospace, so a placeholder of as many characters keeps the tile as wide as the hidden word
    this.lexemeElement.textContent = '_'.repeat(this.length);
    this.containerElement.append(this.lexemeElement, this.firstLetterElement);

    this.containerElement.addEventListener('click', () => {
      if (!this.isShown) {
        this.revealRequestPubSub.publish(this.index);
      }
    });
  }
}

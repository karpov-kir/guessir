import { Lexeme } from '../../lexemeAnalyzer/types';
import { PubSub } from '../../pubSub/PubSub';
import { ChildRenderer } from '../types';

export enum WordHint {
  None = 'none',
  FirstLetters = 'first-letters',
  Text = 'text',
}

type WordRendererOptions = {
  lexeme: Lexeme;
};

export class WordRenderer implements ChildRenderer {
  private readonly lexeme: Lexeme;
  private readonly containerElement: HTMLElement;
  private readonly userWordShowPubSub = new PubSub<Lexeme>();

  private hint = WordHint.None;

  public isShown = false;
  public readonly userWordShowEvent = this.userWordShowPubSub.event;

  constructor(options: WordRendererOptions) {
    this.lexeme = options.lexeme;
    this.containerElement = document.createElement('button');
    this.containerElement.classList.add('lexeme-container');

    this.initElement();
  }

  public getElement() {
    return this.containerElement;
  }

  /** Reveals the word without publishing `userWordShowEvent`, which only a user click publishes. */
  public show() {
    this.isShown = true;
    this.containerElement.classList.add('show');
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
   * The hidden letters are invisible, so a screen reader would otherwise announce an empty button.
   */
  private renderLabel() {
    const { normalized } = this.lexeme;

    if (this.isShown || this.hint === WordHint.Text) {
      this.containerElement.removeAttribute('aria-label');
    } else if (this.hint === WordHint.FirstLetters) {
      this.containerElement.setAttribute(
        'aria-label',
        `Hidden word starting with ${normalized[0]}, ${normalized.length} letters`,
      );
    } else {
      this.containerElement.setAttribute('aria-label', `Hidden word, ${normalized.length} letters`);
    }
  }

  private initElement() {
    this.renderLabel();

    this.containerElement.innerHTML = `
      <span class="lexeme">${this.lexeme.normalized}</span>
      <span class="lexeme-first-letter">${this.lexeme.normalized[0]}</span>
    `;

    this.attachClickHandler();
  }

  private attachClickHandler() {
    this.containerElement.addEventListener('click', () => {
      if (this.isShown) {
        return;
      }

      this.show();
      this.userWordShowPubSub.publish(this.lexeme);
    });
  }
}

import { Lexeme } from '../../lexemeBuilder';
import { PubSub } from '../../pubSub';
import { ChildrenRenderer } from '../types';

export class WordRenderer implements ChildrenRenderer {
  private lexeme: Lexeme;
  private containerElement: HTMLElement;
  private userWordShowPubSub = new PubSub<Lexeme>();

  public isShown = false;
  public readonly userWordShowEvent = this.userWordShowPubSub.event;

  constructor(lexeme: Lexeme) {
    this.lexeme = lexeme;
    this.containerElement = document.createElement('button');
    this.containerElement.classList.add('lexeme-container');

    this.initElement();
  }

  public getElement() {
    return this.containerElement;
  }

  public show() {
    this.isShown = true;
    this.containerElement?.classList.add('show');
  }

  private initElement() {
    this.containerElement.innerHTML = `
      <span class="lexeme">${this.lexeme.normalized}</span>
      <span class="lexeme-first-letter">${this.lexeme.normalized[0]}</span>
    `;

    this.attachClickHandler();
  }

  private attachClickHandler() {
    this.containerElement?.addEventListener('click', () => {
      if (this.isShown) {
        return;
      }

      this.show();
      this.userWordShowPubSub.publish(this.lexeme);
    });
  }
}

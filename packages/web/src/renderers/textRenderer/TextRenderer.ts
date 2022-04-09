import { Lexeme, LexemeAnalysis } from '../../lexemeBuilder';
import { LexemeNormalizer } from '../../lexemeBuilder/LexemeNormalizer';
import { PubSub } from '../../pubSub';
import { ChildrenRenderer } from '../types';
import { WordRenderer } from './WordRenderer';

export class TextRenderer implements ChildrenRenderer {
  private containerElement: HTMLElement;
  private lexemesAnalysis: LexemeAnalysis;
  private title = '';
  private description?;
  private userWordShowPubSub = new PubSub<Lexeme>();
  private wordRenderers = new Map<
    // Lexeme index
    number,
    WordRenderer
  >();

  public userWordShowEvent = this.userWordShowPubSub.event;

  constructor(lexemesAnalysis: LexemeAnalysis, title: string, description?: string) {
    this.lexemesAnalysis = lexemesAnalysis;
    this.title = title;
    this.description = description;
    this.containerElement = document.createElement('div');
    this.containerElement.id = 'text-container';

    this.initElement();
  }

  public getElement(): HTMLElement {
    return this.containerElement;
  }

  public showLexemesByWord(word: string): number {
    const lexemes = this.lexemesAnalysis.lexemesByWordLike.get(word);
    let shownCount = 0;

    if (!lexemes) {
      return shownCount;
    }

    for (const [index] of lexemes) {
      const wordRenderer = this.wordRenderers.get(index);

      if (!wordRenderer) {
        continue;
      }

      const isShownBefore = wordRenderer.isShown;

      wordRenderer.show();

      if (!isShownBefore) {
        shownCount++;
      }
    }

    return shownCount;
  }

  public toggleText(isShown: boolean) {
    this.containerElement.classList.remove('show-text', 'show-first-letters');

    if (isShown) {
      this.containerElement.classList.add('show-text');
    } else {
      this.containerElement.classList.remove('show-text');
    }
  }

  public toggleFirstLetters(isShown: boolean) {
    this.containerElement.classList.remove('show-text', 'show-first-letters');

    if (isShown) {
      this.containerElement.classList.add('show-first-letters');
    } else {
      this.containerElement.classList.remove('show-first-letters');
    }
  }

  private initElement() {
    if (this.title) {
      const titleElement = document.createElement('h1');
      titleElement.textContent = this.title;
      this.containerElement.appendChild(titleElement);
    }

    if (this.description) {
      const descriptionElement = document.createElement('p');
      descriptionElement.textContent = this.description;
      this.containerElement.appendChild(descriptionElement);
    }

    for (const [index, lexeme] of this.lexemesAnalysis.lexemes) {
      if (LexemeNormalizer.isLexemeOtherCharacter(lexeme)) {
        this.containerElement.append(this.wrapSpecialCharacter(lexeme));
      } else {
        const wordRenderer = new WordRenderer(lexeme);

        wordRenderer.userWordShowEvent.subscribe((shownLexeme) => this.handleUserWordShow(shownLexeme));
        this.wordRenderers.set(index, wordRenderer);
        this.containerElement.appendChild(wordRenderer.getElement());
      }
    }
  }

  private wrapSpecialCharacter(lexeme: Lexeme): HTMLElement | string {
    if (lexeme.normalized === '\n') {
      return document.createElement('br');
    }

    return lexeme.normalized;
  }

  private handleUserWordShow(lexeme: Lexeme) {
    this.userWordShowPubSub.publish(lexeme);
  }
}

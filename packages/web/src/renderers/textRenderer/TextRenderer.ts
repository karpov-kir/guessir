import { LexemeNormalizer } from '../../lexemeAnalyzer/LexemeNormalizer';
import { Lexeme, LexemeAnalysis } from '../../lexemeAnalyzer/types';
import { PubSub } from '../../pubSub/PubSub';
import { ChildRenderer } from '../types';
import { WordRenderer } from './WordRenderer';

type TextRendererOptions = {
  lexemesAnalysis: LexemeAnalysis;
  title?: string;
  description?: string;
  userWordShowPubSub?: PubSub<Lexeme>;
};

export class TextRenderer implements ChildRenderer {
  private readonly containerElement: HTMLElement;
  private readonly lexemesAnalysis: LexemeAnalysis;
  private readonly title?: string;
  private readonly description?: string;
  private readonly userWordShowPubSub: PubSub<Lexeme>;
  private readonly wordRenderers = new Map<
    // Lexeme index
    number,
    WordRenderer
  >();

  public userWordShowEvent: PubSub<Lexeme>['event'];

  constructor(options: TextRendererOptions) {
    this.userWordShowPubSub = options.userWordShowPubSub || new PubSub<Lexeme>();
    this.userWordShowEvent = this.userWordShowPubSub.event;
    this.lexemesAnalysis = options.lexemesAnalysis;
    this.title = options.title;
    this.description = options.description;
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
    this.containerElement.innerHTML = `
      <h1 id="title" class="hide"></h1>
      <p id="description" class="hide"></p>
      <div id="lexemes"></div>
    `;

    const { titleElement, descriptionElement, lexemesElement } = getElements(this.containerElement);

    if (this.title) {
      titleElement.classList.remove('hide');
      // XSS safe
      titleElement.textContent = this.title;
    }

    if (this.description) {
      descriptionElement.classList.remove('hide');
      // XSS safe
      descriptionElement.textContent = this.description;
    }

    for (const [index, lexeme] of this.lexemesAnalysis.lexemes) {
      if (LexemeNormalizer.isLexemeOtherCharacter(lexeme)) {
        lexemesElement.append(this.wrapSpecialCharacter(lexeme));
      } else {
        const wordRenderer = new WordRenderer({ lexeme });

        wordRenderer.userWordShowEvent.subscribe((shownLexeme) => this.handleUserWordShow(shownLexeme));
        this.wordRenderers.set(index, wordRenderer);
        lexemesElement.appendChild(wordRenderer.getElement());
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

export function getElements(containerElement: HTMLElement) {
  const titleElement = containerElement.querySelector('#title') as HTMLElement;
  const descriptionElement = containerElement.querySelector('#description') as HTMLElement;
  const lexemesElement = containerElement.querySelector('#lexemes') as HTMLElement;

  return { titleElement, descriptionElement, lexemesElement };
}

import { RevealedWord, SkeletonLexeme } from '@guessir/shared/dist/game/types';

import { PubSub } from '../../pubSub/PubSub';
import { ChildRenderer } from '../types';
import { WordHint, WordRenderer } from './WordRenderer';

type TextRendererOptions = {
  lexemes: SkeletonLexeme[];
  title?: string;
  description?: string;
  revealRequestPubSub?: PubSub<number>;
};

export class TextRenderer implements ChildRenderer {
  private readonly containerElement: HTMLElement;
  private readonly lexemes: SkeletonLexeme[];
  private readonly title?: string;
  private readonly description?: string;
  private readonly revealRequestPubSub: PubSub<number>;
  private readonly wordRenderers = new Map<
    // Lexeme index
    number,
    WordRenderer
  >();
  /** Words of the last successful guess, highlighted so the user sees where they landed */
  private freshWordRenderers: WordRenderer[] = [];

  /** Publishes the lexeme index of a hidden word the user clicks. */
  public revealRequestEvent: PubSub<number>['event'];

  constructor(options: TextRendererOptions) {
    this.revealRequestPubSub = options.revealRequestPubSub || new PubSub<number>();
    this.revealRequestEvent = this.revealRequestPubSub.event;
    this.lexemes = options.lexemes;
    this.title = options.title;
    this.description = options.description;
    this.containerElement = document.createElement('article');
    this.containerElement.id = 'text-container';

    this.initElement();
  }

  public getElement(): HTMLElement {
    return this.containerElement;
  }

  /**
   * Shows the guessed words and returns how many of them were hidden before.
   * Moves the fresh highlight to these words only when at least one word was newly shown.
   */
  public showGuessedWords(words: RevealedWord[]): number {
    const guessedWordRenderers: WordRenderer[] = [];
    let shownCount = 0;

    for (const revealedWord of words) {
      const wordRenderer = this.wordRenderers.get(revealedWord.index);

      if (!wordRenderer) {
        continue;
      }

      if (this.showWord(revealedWord)) {
        shownCount++;
      }

      guessedWordRenderers.push(wordRenderer);
    }

    // A guess that opens nothing new is a miss, so the highlight stays on the last guess that opened words
    if (shownCount) {
      this.freshWordRenderers.forEach((wordRenderer) => wordRenderer.markFresh(false));
      guessedWordRenderers.forEach((wordRenderer) => wordRenderer.markFresh(true));
      this.freshWordRenderers = guessedWordRenderers;
    }

    return shownCount;
  }

  /** Shows one revealed word and returns whether it was hidden before. */
  public showWord({ index, word }: RevealedWord): boolean {
    const wordRenderer = this.wordRenderers.get(index);

    if (!wordRenderer || wordRenderer.isShown) {
      return false;
    }

    wordRenderer.show(word);

    return true;
  }

  public fillFirstLetters(firstLetters: RevealedWord[]) {
    firstLetters.forEach(({ index, word }) => this.wordRenderers.get(index)?.setFirstLetter(word));
  }

  public fillWords(words: RevealedWord[]) {
    words.forEach(({ index, word }) => this.wordRenderers.get(index)?.setWord(word));
  }

  public setHint(hint: WordHint) {
    this.containerElement.classList.remove('show-text', 'show-first-letters');

    if (hint === WordHint.Text) {
      this.containerElement.classList.add('show-text');
    } else if (hint === WordHint.FirstLetters) {
      this.containerElement.classList.add('show-first-letters');
    }

    this.wordRenderers.forEach((wordRenderer) => wordRenderer.setHint(hint));
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

    for (const lexeme of this.lexemes) {
      if ('character' in lexeme) {
        lexemesElement.append(this.wrapSpecialCharacter(lexeme.character));
      } else {
        const wordRenderer = new WordRenderer(lexeme);

        wordRenderer.revealRequestEvent.subscribe((index) => this.revealRequestPubSub.publish(index));
        this.wordRenderers.set(lexeme.index, wordRenderer);
        lexemesElement.appendChild(wordRenderer.getElement());
      }
    }
  }

  private wrapSpecialCharacter(character: string): HTMLElement | string {
    if (character === '\n') {
      return document.createElement('br');
    }

    return character;
  }
}

export function getElements(containerElement: HTMLElement) {
  const titleElement = containerElement.querySelector('#title') as HTMLElement;
  const descriptionElement = containerElement.querySelector('#description') as HTMLElement;
  const lexemesElement = containerElement.querySelector('#lexemes') as HTMLElement;

  return { titleElement, descriptionElement, lexemesElement };
}

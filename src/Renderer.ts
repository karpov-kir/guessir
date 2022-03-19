import { Lexeme, LexemeAnalysis, LexemeType } from './LexemeBuilder';
import { PubSub } from './PubSub';

export class Renderer {
  private lexemesAnalysis: LexemeAnalysis;
  private containerElement: HTMLElement;
  private scoreRenderer!: ScoreRenderer;
  private isTextShown = false;
  private wordRenderers: Map<
    // Lexeme index
    number,
    WordRenderer
  > = new Map();

  constructor(lexemesAnalysis: LexemeAnalysis, containerElement: HTMLElement) {
    this.lexemesAnalysis = lexemesAnalysis;
    this.containerElement = containerElement;
  }

  public init() {
    this.scoreRenderer = new ScoreRenderer(this.lexemesAnalysis.wordLikeCount);

    for (const [index, lexeme] of this.lexemesAnalysis.lexemes) {
      const lexemeElement = this.getLexemeElement(lexeme);

      if (typeof lexemeElement === 'string') {
        this.containerElement.append(lexemeElement);
      } else if (lexemeElement instanceof WordRenderer) {
        this.wordRenderers.set(index, lexemeElement);
        this.containerElement.appendChild(lexemeElement.getElement());
        lexemeElement.clickEvent.subscribe((event) => this.handleWordClick(event));
      } else {
        this.containerElement.appendChild(lexemeElement);
      }
    }

    const controlsContainer = document.createElement('div');

    controlsContainer.id = 'controls-container';
    controlsContainer.innerHTML = `
      <input id="guess-input" type="text" />
      <button id="show-text-button" type="button">Show text</button>
      <button id="show-first-letters-button" type="button">Show first letters</button>
      <button id="guess-button" type="button">Guess</button>
    `;

    controlsContainer.appendChild(this.scoreRenderer.getElement());

    this.containerElement.appendChild(controlsContainer);
    this.attachGuessHandler();
    this.attachShowTextHandler();
    this.attachShowFirstLettersHandler();
  }

  private getLexemeElement(lexeme: Lexeme): HTMLElement | WordRenderer | string {
    if (lexeme.type === LexemeType.SpecialCharacter) {
      if (lexeme.normalized === '\n') {
        return document.createElement('br');
      }

      return lexeme.normalized;
    }

    return new WordRenderer(lexeme);
  }

  private attachGuessHandler() {
    const buttonElement = document.getElementById('guess-button') as HTMLButtonElement;
    const inputElement = document.getElementById('guess-input') as HTMLButtonElement;

    buttonElement.addEventListener('click', () => {
      const word = inputElement.value.trim().toLowerCase();
      const lexemes = this.lexemesAnalysis.lexemesByWordLike.get(word);

      if (!lexemes) {
        return;
      }

      for (const [index] of lexemes) {
        const wordRenderer = this.wordRenderers.get(index);
        const isShownBefore = wordRenderer?.isShown;

        wordRenderer?.show();

        if (!isShownBefore) {
          this.scoreRenderer.addScore(1);
        }
      }
    });
  }

  private attachShowTextHandler() {
    const buttonElement = document.getElementById('show-text-button') as HTMLButtonElement;

    buttonElement.addEventListener('click', () => {
      if (this.containerElement.classList.contains('show-text')) {
        this.hideText();
      } else {
        this.showText();
        this.scoreRenderer.addScore(-50);
      }
    });
  }

  private hideText() {
    this.containerElement.classList.remove('show-text');
    this.isTextShown = false;
  }

  private showText() {
    this.containerElement.classList.add('show-text');
    this.hideFirstLetters();
    this.isTextShown = true;
  }

  private attachShowFirstLettersHandler() {
    const buttonElement = document.getElementById('show-first-letters-button') as HTMLButtonElement;

    buttonElement.addEventListener('click', () => {
      if (this.isTextShown) {
        return;
      }

      if (this.containerElement.classList.contains('show-first-letters')) {
        this.hideFirstLetters();
      } else {
        this.showFirstLetters();
        this.scoreRenderer.addScore(-10);
      }
    });
  }

  private hideFirstLetters() {
    this.containerElement.classList.remove('show-first-letters');
  }

  private showFirstLetters() {
    this.containerElement.classList.add('show-first-letters');
  }

  private handleWordClick({ wordRenderer, wasShownPrevious }: WordClickEvent) {
    if (!wasShownPrevious && wordRenderer.isShown) {
      this.scoreRenderer.addScore(-1);
    }
  }
}

interface ChildrenRenderer {
  getElement(): HTMLElement;
}

interface WordClickEvent {
  wordRenderer: WordRenderer;
  lexeme: Lexeme;
  wasShownPrevious: boolean;
}

class WordRenderer implements ChildrenRenderer {
  private lexeme: Lexeme;
  private containerElement!: HTMLElement;
  private clickPubSub = new PubSub<WordClickEvent>();

  public isShown = false;
  public readonly clickEvent = this.clickPubSub.event;

  constructor(lexeme: Lexeme) {
    this.lexeme = lexeme;

    this.initializeElement();
  }

  public getElement() {
    return this.containerElement;
  }

  public show() {
    this.isShown = true;
    this.containerElement?.classList.add('show');
  }

  private initializeElement() {
    this.containerElement = document.createElement('span');
    this.containerElement.classList.add('lexeme-container');

    this.containerElement.innerHTML = `
      <span class="lexeme">${this.lexeme.normalized}</span>
      <span class="lexeme-first-letter">${this.lexeme.normalized[0]}</span>
    `;

    this.attachClickHandler();
  }

  private attachClickHandler() {
    this.containerElement?.addEventListener('click', () => {
      const isShownBefore = this.isShown;

      this.show();

      this.clickPubSub.publish({
        wordRenderer: this,
        lexeme: this.lexeme,
        wasShownPrevious: isShownBefore,
      });
    });
  }
}

class ScoreRenderer implements ChildrenRenderer {
  private wordLikeCount = 0;
  private score = 0;
  private containerElement!: HTMLElement;
  private currentScoreElement!: HTMLElement;

  constructor(wordLikeCount: number) {
    this.wordLikeCount = wordLikeCount;

    this.initializeElement();
  }

  public getElement(): HTMLElement {
    return this.containerElement;
  }

  public addScore(value: number) {
    this.score += value;

    this.currentScoreElement.innerText = this.score.toString();
  }

  private initializeElement() {
    this.containerElement = document.createElement('div');
    this.containerElement.id = 'score-container';

    this.containerElement.innerHTML = `
      Score:&nbsp;
      <div id="current-score">${this.score}</div>
      /
      <div id="total-score">${this.wordLikeCount}</div>
    `;

    this.currentScoreElement = this.containerElement.querySelector('#current-score') as HTMLElement;
  }
}

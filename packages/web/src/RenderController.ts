import { Lexeme, LexemeAnalysis } from './lexemeAnalyzer/types';
import { ControlsRenderer, GuessEvent } from './renderers/ControlsRenderer';
import { CreateTextRenderer } from './renderers/CreateTextRenderer';
import { ScoreRenderer } from './renderers/ScoreRenderer';
import { TextRenderer } from './renderers/textRenderer/TextRenderer';

export type RenderControllerOptions = {
  lexemesAnalysis: LexemeAnalysis;
  title?: string;
  description?: string;
  allowShowingText?: boolean;
  allowShowingFirstLetters?: boolean;
  textRenderer?: TextRenderer;
  controlsRenderer?: ControlsRenderer;
  scoreRenderer?: ScoreRenderer;
  createTextRenderer?: CreateTextRenderer;
};

export class RenderController {
  private readonly guessirContainer: HTMLElement;

  private readonly textRenderer: TextRenderer;
  private readonly controlsRenderer: ControlsRenderer;
  private readonly scoreRenderer: ScoreRenderer;
  private readonly utilsRenderer: CreateTextRenderer;

  constructor(options: RenderControllerOptions) {
    this.guessirContainer = document.createElement('div');
    this.guessirContainer.id = 'guessir';
    this.textRenderer =
      options.textRenderer ||
      new TextRenderer({
        lexemesAnalysis: options.lexemesAnalysis,
        title: options.title,
        description: options.description,
      });
    this.controlsRenderer =
      options.controlsRenderer ||
      new ControlsRenderer({
        allowShowingText: options.allowShowingText,
        allowShowingFirstLetters: options.allowShowingFirstLetters,
      });
    this.scoreRenderer =
      options.scoreRenderer ||
      new ScoreRenderer({
        wordLikeCount: options.lexemesAnalysis.wordLikeCount,
      });
    this.utilsRenderer = options.createTextRenderer || new CreateTextRenderer();
  }

  public init(containerElement: HTMLElement) {
    containerElement.appendChild(this.guessirContainer);

    this.textRenderer.userWordShowEvent.subscribe((lexeme) => this.handleUserWordShow(lexeme));

    this.controlsRenderer.guessEvent.subscribe((guessEvent) => this.handleGuess(guessEvent));
    this.controlsRenderer.showTextEvent.subscribe((isTextShown) => this.handleShowText(isTextShown));
    this.controlsRenderer.showFirstLettersEvent.subscribe((isFirstLettersShown) =>
      this.handleShowFirstLetters(isFirstLettersShown),
    );

    this.guessirContainer.appendChild(this.textRenderer.getElement());
    this.guessirContainer.appendChild(this.controlsRenderer.getElement());
    this.guessirContainer.appendChild(this.scoreRenderer.getElement());
    this.guessirContainer.appendChild(this.utilsRenderer.getElement());
  }

  private handleUserWordShow(_lexeme: Lexeme) {
    this.scoreRenderer.addScore(1);
  }

  private handleGuess({ word }: GuessEvent) {
    const shownCount = this.textRenderer.showLexemesByWord(word);

    if (shownCount) {
      this.controlsRenderer.clearAndFocusGuessInput();
    } else {
      this.controlsRenderer.shakeAndError();
    }

    this.scoreRenderer.addScore(shownCount);
  }

  private handleShowText(isTextShown: boolean) {
    this.textRenderer.toggleText(isTextShown);

    if (isTextShown) {
      // TODO is there an interesting way to handle it to entertain the user?
    }
  }

  private handleShowFirstLetters(isFirstLettersShown: boolean) {
    this.textRenderer.toggleFirstLetters(isFirstLettersShown);

    if (isFirstLettersShown) {
      // TODO is there an interesting way to handle it to entertain the user?
    }
  }
}

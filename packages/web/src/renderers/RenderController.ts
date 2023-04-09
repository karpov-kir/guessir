import { Lexeme, LexemeAnalysis } from '../lexemeAnalyzer/types';
import { ControlsRenderer, GuessEvent } from './ControlsRenderer';
import { CreateTextRenderer } from './CreateTextRenderer';
import { ScoreRenderer } from './ScoreRenderer';
import { TextRenderer } from './textRenderer/TextRenderer';

type RenderControllerOptions = {
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
  private guessirContainer: HTMLElement;

  private textRenderer: TextRenderer;
  private controlsRenderer: ControlsRenderer;
  private scoreRenderer: ScoreRenderer;
  private utilsRenderer: CreateTextRenderer;

  constructor(options: RenderControllerOptions) {
    const {
      lexemesAnalysis,
      title,
      description,
      allowShowingText,
      allowShowingFirstLetters,
      textRenderer,
      controlsRenderer,
      scoreRenderer,
      createTextRenderer,
    } = options;

    this.guessirContainer = document.createElement('div');
    this.guessirContainer.id = 'guessir';
    this.textRenderer =
      textRenderer ||
      new TextRenderer({
        lexemesAnalysis,
        title,
        description,
      });
    this.controlsRenderer =
      controlsRenderer ||
      new ControlsRenderer({
        allowShowingText,
        allowShowingFirstLetters,
      });
    this.scoreRenderer =
      scoreRenderer ||
      new ScoreRenderer({
        wordLikeCount: lexemesAnalysis.wordLikeCount,
      });
    this.utilsRenderer = createTextRenderer || new CreateTextRenderer();
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
    this.scoreRenderer.addScore(-1);
  }

  private handleGuess({ word }: GuessEvent) {
    const shownCount = this.textRenderer.showLexemesByWord(word);

    if (shownCount) {
      this.controlsRenderer.cleanAndFocusGuessInput();
    }

    this.scoreRenderer.addScore(shownCount);
  }

  private handleShowText(isTextShown: boolean) {
    this.textRenderer.toggleText(isTextShown);

    if (isTextShown) {
      this.scoreRenderer.addScore(-7);
    }
  }

  private handleShowFirstLetters(isFirstLettersShown: boolean) {
    this.textRenderer.toggleFirstLetters(isFirstLettersShown);

    if (isFirstLettersShown) {
      this.scoreRenderer.addScore(-2);
    }
  }
}

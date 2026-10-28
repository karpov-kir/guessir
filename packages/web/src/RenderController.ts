import { RevealedWord } from '@guessir/shared/dist/game/types';

import { Game } from './game/Game';
import { ControlsRenderer, GuessEvent } from './renderers/ControlsRenderer';
import { CreateTextRenderer } from './renderers/CreateTextRenderer';
import { ScoreRenderer } from './renderers/ScoreRenderer';
import { TextRenderer } from './renderers/textRenderer/TextRenderer';
import { WordHint } from './renderers/textRenderer/WordRenderer';

export type RenderControllerOptions = {
  game: Game;
  textRenderer?: TextRenderer;
  controlsRenderer?: ControlsRenderer;
  scoreRenderer?: ScoreRenderer;
  createTextRenderer?: CreateTextRenderer;
};

export class RenderController {
  private readonly guessirContainer: HTMLElement;
  private readonly game: Game;

  private readonly textRenderer: TextRenderer;
  private readonly controlsRenderer: ControlsRenderer;
  private readonly scoreRenderer: ScoreRenderer;
  private readonly utilsRenderer: CreateTextRenderer;

  /** The hint the user turned on last, which turns on once its letters load. */
  private wantedHint = WordHint.None;
  private firstLettersLoad?: Promise<void>;
  private wordsLoad?: Promise<void>;

  constructor(options: RenderControllerOptions) {
    const { skeleton } = options.game;

    this.game = options.game;
    this.guessirContainer = document.createElement('main');
    this.guessirContainer.id = 'guessir';
    this.textRenderer =
      options.textRenderer ||
      new TextRenderer({
        lexemes: skeleton.lexemes,
        title: skeleton.title,
        description: skeleton.description,
      });
    this.controlsRenderer =
      options.controlsRenderer ||
      new ControlsRenderer({
        allowShowingText: skeleton.allowShowingText,
        allowShowingFirstLetters: skeleton.allowShowingFirstLetters,
      });
    this.scoreRenderer =
      options.scoreRenderer ||
      new ScoreRenderer({
        wordLikeCount: skeleton.wordCount,
      });
    this.utilsRenderer = options.createTextRenderer || new CreateTextRenderer();
  }

  public init(containerElement: HTMLElement) {
    containerElement.appendChild(this.guessirContainer);

    this.textRenderer.revealRequestEvent.subscribe((index) => void this.handleRevealRequest(index));

    this.controlsRenderer.guessEvent.subscribe((guessEvent) => void this.handleGuess(guessEvent));
    this.controlsRenderer.showTextEvent.subscribe((isTextShown) => void this.handleShowText(isTextShown));
    this.controlsRenderer.showFirstLettersEvent.subscribe(
      (isFirstLettersShown) => void this.handleShowFirstLetters(isFirstLettersShown),
    );

    // The score and the controls stay together and stick to the screen edge, so a long text never scrolls them away.
    // They share a wrapper with the text alone, so they stop sticking at the text end and leave the create-text form
    // below them uncovered.
    const gameElement = document.createElement('div');
    const hudElement = document.createElement('section');

    gameElement.id = 'game';
    hudElement.id = 'hud';
    hudElement.setAttribute('aria-label', 'Game controls');
    hudElement.appendChild(this.scoreRenderer.getElement());
    hudElement.appendChild(this.controlsRenderer.getElement());

    gameElement.appendChild(hudElement);
    gameElement.appendChild(this.textRenderer.getElement());
    this.guessirContainer.appendChild(gameElement);
    this.guessirContainer.appendChild(this.utilsRenderer.getElement());
  }

  private async handleRevealRequest(index: number) {
    let revealedWord: RevealedWord;

    try {
      revealedWord = await this.game.reveal(index);
    } catch (error) {
      console.error('Failed to reveal the word', { index }, error);
      this.controlsRenderer.announce('Could not open this word');
      return;
    }

    if (this.textRenderer.showWord(revealedWord)) {
      this.scoreRenderer.addScore(1);
    }
  }

  private async handleGuess({ word }: GuessEvent) {
    let guessedWords: RevealedWord[];

    try {
      guessedWords = await this.game.guess(word);
    } catch (error) {
      console.error('Failed to check the guess', error);
      this.controlsRenderer.returnGuess(word);
      this.controlsRenderer.announce('Could not check this guess');
      return;
    }

    const shownCount = this.textRenderer.showGuessedWords(guessedWords);

    if (!shownCount) {
      this.controlsRenderer.returnGuess(word);
      this.controlsRenderer.shakeAndError();
    }

    this.scoreRenderer.addScore(shownCount);
  }

  private async handleShowText(isTextShown: boolean) {
    await this.switchHint({
      hint: WordHint.Text,
      isShown: isTextShown,
      load: () => this.loadWords(),
      uncheck: () => this.controlsRenderer.uncheckText(),
      failureStatus: 'Could not load the text',
    });
  }

  private async handleShowFirstLetters(isFirstLettersShown: boolean) {
    await this.switchHint({
      hint: WordHint.FirstLetters,
      isShown: isFirstLettersShown,
      load: () => this.loadFirstLetters(),
      uncheck: () => this.controlsRenderer.uncheckFirstLetters(),
      failureStatus: 'Could not load the first letters',
    });
  }

  /**
   * Turns a hint off at once, or on once its letters load. The user can switch hints while the letters load, so only
   * the hint turned on last is shown, and a failed load unchecks its hint only while it is still the one turned on.
   */
  private async switchHint(options: {
    hint: WordHint;
    isShown: boolean;
    load: () => Promise<void>;
    uncheck: () => void;
    failureStatus: string;
  }) {
    if (!options.isShown) {
      this.wantedHint = WordHint.None;
      this.textRenderer.setHint(WordHint.None);
      return;
    }

    this.wantedHint = options.hint;

    try {
      await options.load();
    } catch (error) {
      console.error('Failed to load the hint', { hint: options.hint }, error);

      if (this.wantedHint === options.hint) {
        this.wantedHint = WordHint.None;
        options.uncheck();
        this.controlsRenderer.announce(options.failureStatus);
      }

      return;
    }

    if (this.wantedHint === options.hint) {
      this.textRenderer.setHint(options.hint);
    }
  }

  /** Loads the first letters into the text once, and again after a failed load. */
  private loadFirstLetters(): Promise<void> {
    this.firstLettersLoad ??= this.game.firstLetters().then(
      (firstLetters) => this.textRenderer.fillFirstLetters(firstLetters),
      (error: unknown) => {
        this.firstLettersLoad = undefined;
        throw error;
      },
    );

    return this.firstLettersLoad;
  }

  /** Loads the words into the text once, and again after a failed load. */
  private loadWords(): Promise<void> {
    this.wordsLoad ??= this.game.words().then(
      (words) => this.textRenderer.fillWords(words),
      (error: unknown) => {
        this.wordsLoad = undefined;
        throw error;
      },
    );

    return this.wordsLoad;
  }
}

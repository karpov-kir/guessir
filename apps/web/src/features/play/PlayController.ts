import { RevealedWord } from "@guessir/game";

import { Game } from "../../entities/game/exports";
import { ControlsRenderer } from "./ControlsRenderer";
import { ScoreRenderer } from "./ScoreRenderer";
import { TextRenderer } from "./text/TextRenderer";
import { WordHint } from "./text/WordRenderer";
import { Logger } from "../../shared/Logger";

const logger = Logger.root.scope("PlayController");

export type PlayControllerOptions = {
  game: Game;
};

export class PlayController {
  private readonly game: Game;

  private readonly textRenderer: TextRenderer;
  private readonly controlsRenderer: ControlsRenderer;
  private readonly scoreRenderer: ScoreRenderer;
  private readonly gameElement: HTMLElement;

  /** The hint the user turned on last, which turns on once its letters load. */
  private wantedHint = WordHint.None;
  private firstLettersLoad?: Promise<void>;
  private wordsLoad?: Promise<void>;

  constructor(options: PlayControllerOptions) {
    const { skeleton } = options.game;

    this.game = options.game;
    this.textRenderer = new TextRenderer({
      lexemes: skeleton.lexemes,
      title: skeleton.title,
      description: skeleton.description,
      onRevealRequest: (index) => void this.handleRevealRequest(index),
    });
    this.controlsRenderer = new ControlsRenderer({
      allowShowingText: skeleton.allowShowingText,
      allowShowingFirstLetters: skeleton.allowShowingFirstLetters,
      onGuess: (word) => void this.handleGuess(word),
      onShowFirstLetters: (isFirstLettersShown) =>
        void this.handleShowFirstLetters(isFirstLettersShown),
      onShowText: (isTextShown) => void this.handleShowText(isTextShown),
    });
    this.scoreRenderer = new ScoreRenderer({
      wordLikeCount: skeleton.wordCount,
    });
    this.gameElement = this.renderGame();
  }

  /** Returns the `#game` element, which shows the game and answers the player's moves. */
  public getElement(): HTMLElement {
    return this.gameElement;
  }

  private renderGame() {
    // The HUD holds the score and the controls and sticks to the screen edge, so a long text never
    // scrolls them away. The HUD shares a wrapper with the text alone, so it stops sticking at the
    // text end and leaves the create-text form below it uncovered.
    const gameElement = document.createElement("div");
    const hudElement = document.createElement("section");

    gameElement.id = "game";
    hudElement.id = "hud";
    hudElement.setAttribute("aria-label", "Game controls");
    hudElement.appendChild(this.scoreRenderer.getElement());
    hudElement.appendChild(this.controlsRenderer.getElement());

    gameElement.appendChild(hudElement);
    gameElement.appendChild(this.textRenderer.getElement());

    return gameElement;
  }

  private async handleRevealRequest(index: number) {
    let revealedWord: RevealedWord;

    try {
      revealedWord = await this.game.reveal(index);
    } catch (error) {
      logger.error("Failed to reveal the word", { index }, error);
      this.controlsRenderer.announce("Could not open this word");
      return;
    }

    if (this.textRenderer.showWord(revealedWord)) {
      this.scoreRenderer.addScore(1);
    }
  }

  private async handleGuess(word: string) {
    let guessedWords: RevealedWord[];

    try {
      guessedWords = await this.game.guess(word);
    } catch (error) {
      logger.error("Failed to check the guess", { word }, error);
      this.controlsRenderer.returnGuess(word);
      this.controlsRenderer.announce("Could not check this guess");
      return;
    }

    const shownCount = this.textRenderer.showGuessedWords(guessedWords);

    if (shownCount) {
      this.controlsRenderer.acceptGuess(word);
    } else {
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
      failureStatus: "Could not load the text",
    });
  }

  private async handleShowFirstLetters(isFirstLettersShown: boolean) {
    await this.switchHint({
      hint: WordHint.FirstLetters,
      isShown: isFirstLettersShown,
      load: () => this.loadFirstLetters(),
      uncheck: () => this.controlsRenderer.uncheckFirstLetters(),
      failureStatus: "Could not load first letters",
    });
  }

  /**
   * Turns a hint off at once, or on once its letters load. The user can switch hints while the
   * letters load, so only the hint turned on last is shown. A failed load unchecks its hint only
   * while that hint is still on.
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
      logger.error("Failed to load the hint", { hint: options.hint }, error);

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

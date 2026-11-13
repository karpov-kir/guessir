import {
  CreateTextDtoResponse,
  RevealedWord,
  RevealedWords,
  TextGame,
  TextSkeleton,
} from "@guessir/game";

import { LruCache } from "../../shared/LruCache.js";
import { createText } from "./createText.js";
import {
  HintNotAllowedError,
  NewText,
  Text,
  TextNotFoundError,
  TextRows,
  WordNotFoundError,
} from "./types.js";

type PlayedText = { text: Text; textGame: TextGame };

const cachedTextCount = 200;

/**
 * Stores texts and answers the moves of the games over them. A move gets only the words it opens,
 * so the text stays on the server and a player cannot read the hidden words in the browser.
 */
export class Texts {
  /**
   * Keeps the analysed game of recently played texts, so a move does not reload and re-analyse its
   * text. A text never changes after it is created, so a cached game never goes stale.
   */
  private readonly playedTexts = new LruCache<string, PlayedText>(cachedTextCount);

  constructor(private readonly rows: TextRows) {}

  /** Stores a new text and returns its id. */
  public create(newText: NewText): Promise<CreateTextDtoResponse> {
    return createText(this.rows, newText);
  }

  public async findSkeleton(id: string): Promise<TextSkeleton> {
    const { text, textGame } = await this.findPlayedText(id);

    return {
      title: text.title,
      description: text.description,
      allowShowingFirstLetters: text.allowShowingFirstLetters,
      allowShowingText: text.allowShowingText,
      wordCount: textGame.wordCount,
      lexemes: textGame.lexemes(),
    };
  }

  public async guess(id: string, word: string): Promise<RevealedWords> {
    const { textGame } = await this.findPlayedText(id);

    return { words: textGame.guess(word) };
  }

  /** Returns the word at `index`. Throws WordNotFoundError when no word sits there. */
  public async reveal(id: string, index: number): Promise<RevealedWord> {
    const { textGame } = await this.findPlayedText(id);
    const revealedWord = textGame.reveal(index);

    if (!revealedWord) {
      throw new WordNotFoundError(index);
    }

    return revealedWord;
  }

  public async firstLetters(id: string): Promise<RevealedWords> {
    const { text, textGame } = await this.findPlayedText(id);

    if (!text.allowShowingFirstLetters) {
      throw new HintNotAllowedError("first letters");
    }

    return { words: textGame.firstLetters() };
  }

  public async words(id: string): Promise<RevealedWords> {
    const { text, textGame } = await this.findPlayedText(id);

    if (!text.allowShowingText) {
      throw new HintNotAllowedError("text");
    }

    return { words: textGame.words() };
  }

  /** Returns the text with `id` and its analysed game. Throws TextNotFoundError when there is none. */
  private async findPlayedText(id: string): Promise<PlayedText> {
    const cachedPlayedText = this.playedTexts.get(id);

    if (cachedPlayedText) {
      return cachedPlayedText;
    }

    const text = await this.rows.getById(id);

    if (!text) {
      throw new TextNotFoundError(id);
    }

    const playedText = { text, textGame: new TextGame(text.text) };

    this.playedTexts.set(id, playedText);

    return playedText;
  }
}

import { RevealedWord, SkeletonLexeme } from "@guessir/game";

import { PubSub } from "../../pubSub/PubSub";
import { requireElement } from "../../utils/dom";
import { ChildRenderer } from "../types";
import { WordHint, WordRenderer } from "./WordRenderer";

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
  /** Holds the words of the last successful guess, which the renderer highlights for the player. */
  private freshWordRenderers: WordRenderer[] = [];

  /** Publishes the lexeme index of a hidden word the user clicks. */
  public revealRequestEvent: PubSub<number>["event"];

  constructor(options: TextRendererOptions) {
    this.revealRequestPubSub = options.revealRequestPubSub || new PubSub<number>();
    this.revealRequestEvent = this.revealRequestPubSub.event;
    this.lexemes = options.lexemes;
    this.title = options.title;
    this.description = options.description;
    this.containerElement = document.createElement("article");
    this.containerElement.id = "text-container";

    this.initElement();
  }

  public getElement(): HTMLElement {
    return this.containerElement;
  }

  /**
   * Shows the guessed words and returns how many of them were hidden before. Moves the fresh
   * highlight to these words only when at least one word was newly shown.
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
    this.containerElement.classList.remove("show-text", "show-first-letters");

    if (hint === WordHint.Text) {
      this.containerElement.classList.add("show-text");
    } else if (hint === WordHint.FirstLetters) {
      this.containerElement.classList.add("show-first-letters");
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
      titleElement.classList.remove("hide");
      titleElement.textContent = this.title;
    }

    if (this.description) {
      descriptionElement.classList.remove("hide");
      descriptionElement.textContent = this.description;
    }

    this.renderLexemes(lexemesElement);
  }

  /**
   * Groups each word with the punctuation that opens and closes it and keeps the group on one line,
   * so no line starts with a comma or ends with an opening bracket. A word tile is an atomic
   * inline, and a browser may break a line right after it. A standalone dash or slash stays outside
   * the groups, so a line can still break there.
   */
  private renderLexemes(lexemesElement: HTMLElement) {
    let group: HTMLElement | undefined;
    let groupHasWord = false;
    const newGroup = () => {
      const element = document.createElement("span");

      element.classList.add("lexeme-group");
      lexemesElement.append(element);

      return element;
    };

    for (const lexeme of this.lexemes) {
      if (!("character" in lexeme)) {
        const wordRenderer = new WordRenderer(lexeme);

        wordRenderer.revealRequestEvent.subscribe((index) =>
          this.revealRequestPubSub.publish(index),
        );
        this.wordRenderers.set(lexeme.index, wordRenderer);

        if (!group || groupHasWord) {
          group = newGroup();
        }

        group.append(wordRenderer.getElement());
        groupHasWord = true;
        continue;
      }

      const { character } = lexeme;

      if (isClosing(character, groupHasWord)) {
        (group ?? lexemesElement).append(character);
      } else if (isOpening(character)) {
        group = newGroup();
        groupHasWord = false;
        group.append(character);
      } else {
        group = undefined;
        groupHasWord = false;
        lexemesElement.append(character === "\n" ? document.createElement("br") : character);
      }
    }
  }
}

const closingCharacters = new Set([
  ",",
  ".",
  ";",
  ":",
  "!",
  "?",
  ")",
  "]",
  "}",
  "%",
  "…",
  "»",
  "”",
]);
const openingCharacters = new Set(["(", "[", "{", "«", "“", "‘"]);
const straightQuotes = new Set(['"', "'"]);

/**
 * Tells whether the character closes the word before it. A straight quote closes a word only right
 * after it.
 */
function isClosing(character: string, followsWord: boolean) {
  return closingCharacters.has(character) || (followsWord && straightQuotes.has(character));
}

function isOpening(character: string) {
  return openingCharacters.has(character) || straightQuotes.has(character);
}

export function getElements(containerElement: HTMLElement) {
  const titleElement = requireElement({
    root: containerElement,
    selector: "#title",
    type: HTMLElement,
  });
  const descriptionElement = requireElement({
    root: containerElement,
    selector: "#description",
    type: HTMLElement,
  });
  const lexemesElement = requireElement({
    root: containerElement,
    selector: "#lexemes",
    type: HTMLElement,
  });

  return { titleElement, descriptionElement, lexemesElement };
}

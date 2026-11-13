import { CreateTextDto } from "@guessir/game";

/** Means a stored text: the words of one game and the hints its author allows. */
export type Text = {
  id: string;
  title: string;
  description?: string;
  text: string;
  /** Lets the player turn on the hint that shows the first letter of each word. */
  allowShowingFirstLetters: boolean;
  /** Lets the player turn on the hint that shows each hidden word in full. */
  allowShowingText: boolean;
};

/** Holds the stored texts. The feature reads a text by its id and adds new ones. */
export type TextRows = {
  /** Returns the text with `id`, or undefined when there is none. */
  getById(id: string): Promise<Text | undefined>;
  insert(text: Text): Promise<void>;
};

export type NewText = CreateTextDto;

/** Means that no text has the id a request names. */
export class TextNotFoundError extends Error {
  constructor(id: string) {
    super(`No text has the id ${id}`);
    this.name = "TextNotFoundError";
  }
}

/** Means that the text has no word at the index a request names. */
export class WordNotFoundError extends Error {
  constructor(index: number) {
    super(`The text has no word at index ${index}`);
    this.name = "WordNotFoundError";
  }
}

/** Means that the text's author did not allow the hint a request asks for. */
export class HintNotAllowedError extends Error {
  constructor(hint: string) {
    super(`The text does not allow the hint ${hint}`);
    this.name = "HintNotAllowedError";
  }
}

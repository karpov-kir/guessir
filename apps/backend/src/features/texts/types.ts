import { CreateTextDto } from "@guessir/game";

import type { IdGenerator } from "../../shared/IdGenerator.js";
import type { TextRows } from "./port.js";

export type NewText = CreateTextDto;

export type TextsUseCasesOptions = {
  /** Holds the stored texts. */
  rows: TextRows;
  /** Makes the id of a new text. */
  ids: IdGenerator;
};

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

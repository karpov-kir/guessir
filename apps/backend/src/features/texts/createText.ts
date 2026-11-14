import { CreateTextDtoResponse } from "@guessir/game";

import { NewText, TextsOptions } from "./types.js";

/** The length of a text's id. The `texts` table stores it in a CHAR(20) column. */
const idLength = 20;

/** Stores a new text under a fresh id and returns the id. */
export async function createText(
  { rows, ids }: TextsOptions,
  newText: NewText,
): Promise<CreateTextDtoResponse> {
  const id = ids.newId(idLength);

  await rows.insert({ ...newText, id });

  return { id };
}

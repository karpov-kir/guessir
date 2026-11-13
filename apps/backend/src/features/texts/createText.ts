import { CreateTextDtoResponse } from "@guessir/game";
import { nanoid } from "nanoid";

import { NewText, TextRows } from "./types.js";

/** Stores a new text under a fresh 20-character id and returns the id. */
export async function createText(rows: TextRows, newText: NewText): Promise<CreateTextDtoResponse> {
  const id = nanoid(20);

  await rows.insert({ ...newText, id });

  return { id };
}

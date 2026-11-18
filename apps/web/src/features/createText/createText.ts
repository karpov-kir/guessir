import { CreateTextDto, CreateTextDtoResponse, createTextDtoResponseSchema } from "@guessir/game";

import type { CreateTextApi } from "./port";

/** Stores a new text on the server and returns its id. */
export async function createText(
  api: CreateTextApi,
  payload: CreateTextDto,
): Promise<CreateTextDtoResponse> {
  return api.post("texts", payload, createTextDtoResponseSchema);
}

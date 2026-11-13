import { CreateTextDto, CreateTextDtoResponse } from "@guessir/game";

import { HttpClient } from "../utils/HttpClient";

/** Stores a new text on the server and returns its id. */
export async function createText(
  httpClient: HttpClient,
  payload: CreateTextDto,
): Promise<CreateTextDtoResponse> {
  return (await httpClient.post("texts", payload)) as CreateTextDtoResponse;
}

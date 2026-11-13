import { CreateTextDto, CreateTextDtoResponse, createTextDtoResponseSchema } from "@guessir/game";

import type { ZodType } from "zod";

/**
 * Reaches the API: posts a payload to a path under its base URL and returns the JSON body as `schema`
 * reads it. Rejects when the status is not 2xx or the body does not fit `schema`.
 */
export type CreateTextApi = {
  post: <T>(path: string, payload: unknown, schema: ZodType<T>) => Promise<T>;
};

/** Stores a new text on the server and returns its id. */
export async function createText(
  api: CreateTextApi,
  payload: CreateTextDto,
): Promise<CreateTextDtoResponse> {
  return api.post("texts", payload, createTextDtoResponseSchema);
}

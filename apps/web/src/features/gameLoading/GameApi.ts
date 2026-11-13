import type { ZodType } from "zod";

/**
 * Reaches the API: sends a request to a path under its base URL and returns the JSON body as
 * `schema` reads it. Rejects when the status is not 2xx or the body does not fit `schema`.
 */
export type GameApi = {
  get: <T>(path: string, schema: ZodType<T>) => Promise<T>;
  post: <T>(path: string, payload: unknown, schema: ZodType<T>) => Promise<T>;
};

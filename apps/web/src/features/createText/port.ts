import type { ZodType } from "zod";

/**
 * Reaches the API: posts a payload to a path under its base URL and returns the JSON body as `schema`
 * reads it. Rejects when the status is not 2xx or the body does not fit `schema`.
 */
export type CreateTextApi = {
  post: <T>(path: string, payload: unknown, schema: ZodType<T>) => Promise<T>;
};

/** Takes the link to a created text when the user copies it. */
export type ClipboardWriter = Pick<Clipboard, "writeText">;

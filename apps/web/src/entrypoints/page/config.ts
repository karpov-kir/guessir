import { z } from "zod";

/** Means the page's settings, which the composition root reads from the build's environment. */
export type PageConfig = {
  apiBaseUrl: string;
};

const envSchema = z.object({
  GUESSIR_API_BASE_URL: z.url({ error: "must be a URL" }),
});

/** Reads the page's config from `env`, and throws with every problem when a variable is wrong. */
export function parseConfig(env: Readonly<Record<string, unknown>>): PageConfig {
  const parsed = envSchema.safeParse(env);

  if (!parsed.success) {
    throw new Error(`The environment is invalid:\n${z.prettifyError(parsed.error)}`);
  }

  return { apiBaseUrl: parsed.data.GUESSIR_API_BASE_URL };
}

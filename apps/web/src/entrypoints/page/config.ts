import { z } from "zod";

/** Means the page's settings, which the composition root reads from the build's environment. */
export type PageConfig = {
  apiBaseUrl: string;
  analytics: { key: string; endpoint: string; version: string };
};

// The schema checks only that the key and the version are set, and leaves their form to the
// analytics collector. The collector checks that form itself, and throws on a bad one.
const envSchema = z.object({
  GUESSIR_API_BASE_URL: z.url({ error: "must be a URL" }),
  GUESSIR_ARTEL_URL: z.url({ error: "must be a URL" }),
  GUESSIR_ARTEL_KEY: z.string({ error: "must be set" }),
  GUESSIR_VERSION: z.string({ error: "must be set" }),
});

/** Reads the page's config from `env`, and throws with every problem when a variable is wrong. */
export function parseConfig(env: Readonly<Record<string, unknown>>): PageConfig {
  const parsed = envSchema.safeParse(env);

  if (!parsed.success) {
    throw new Error(`The environment is invalid:\n${z.prettifyError(parsed.error)}`);
  }

  return {
    apiBaseUrl: parsed.data.GUESSIR_API_BASE_URL,
    analytics: {
      key: parsed.data.GUESSIR_ARTEL_KEY,
      endpoint: parsed.data.GUESSIR_ARTEL_URL,
      version: parsed.data.GUESSIR_VERSION,
    },
  };
}

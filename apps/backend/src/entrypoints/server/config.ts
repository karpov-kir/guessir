import { z } from "zod";

import type { DbSettings } from "../../infra/db/exports.js";

/** Means the server's settings, which the composition root reads from the environment. */
export type ServerConfig = {
  /** The address the server listens on. */
  host: string;
  port: number;
  db: DbSettings;
};

// A variable set to an empty string counts as unset, so a default or the "required" error applies
const unsetIfEmpty = (value: unknown) => (value === "" ? undefined : value);

const required = z.preprocess(unsetIfEmpty, z.string({ error: "must be set" }));

const portNumber = (fallback: number) =>
  z.preprocess(unsetIfEmpty, z.coerce.number().int().min(0).max(65_535).default(fallback));

const envSchema = z.object({
  HOST: z.preprocess(unsetIfEmpty, z.string().default("0.0.0.0")),
  PORT: portNumber(3020),
  DATABASE_HOST: required,
  DATABASE_PORT: portNumber(5432),
  DATABASE_USER: required,
  // The password always comes from a file: a Docker secret on the server and
  // `env/database-password.development` locally
  DATABASE_PASSWORD_FILE: required,
  DATABASE_NAME: required,
});

/** Reads the server's config from `env`, and throws with every problem when a variable is wrong. */
export function parseConfig(env: Readonly<Record<string, string | undefined>>): ServerConfig {
  const parsed = envSchema.safeParse(env);

  if (!parsed.success) {
    throw new Error(`The environment is invalid:\n${z.prettifyError(parsed.error)}`);
  }

  const {
    HOST,
    PORT,
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_USER,
    DATABASE_PASSWORD_FILE,
    DATABASE_NAME,
  } = parsed.data;

  return {
    host: HOST,
    port: PORT,
    db: {
      host: DATABASE_HOST,
      port: DATABASE_PORT,
      username: DATABASE_USER,
      passwordFile: DATABASE_PASSWORD_FILE,
      database: DATABASE_NAME,
    },
  };
}

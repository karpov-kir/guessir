import { z } from "zod";

import type { DbSettings } from "../db/exports.js";
import { LogFormat } from "../logger/exports.js";
import { LogLevel } from "@guessir/logger";

export enum Environment {
  Development = "development",
  Staging = "staging",
  Production = "production",
}

export type Config = {
  /** The environment ENV names, whose env file `readEnv` reads. */
  environment: Environment;
  /** The address the server listens on. */
  host: string;
  port: number;
  db: DbSettings;
  log: { format: LogFormat; level: LogLevel };
  /** The web origins whose pages may call the API. */
  corsOrigins: string[];
};

// A variable that is empty or only whitespace counts as unset, so a default or the "required" error
// applies
const unsetIfBlank = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const required = z.preprocess(unsetIfBlank, z.string({ error: "must be set" }));

const portNumber = (fallback: number) =>
  z.preprocess(unsetIfBlank, z.coerce.number().int().min(0).max(65_535).default(fallback));

const logLevelNames = ["debug", "info", "warn", "error", "silent"] as const;

const logLevels: Record<(typeof logLevelNames)[number], LogLevel> = {
  debug: LogLevel.Debug,
  info: LogLevel.Info,
  warn: LogLevel.Warn,
  error: LogLevel.Error,
  silent: LogLevel.Silent,
};

const defaultLogFormat = LogFormat.Pretty;

const logFormat = z.preprocess(unsetIfBlank, z.enum(LogFormat).default(defaultLogFormat));

const environment = z.preprocess(
  unsetIfBlank,
  z.enum(Environment).default(Environment.Development),
);

const envSchema = z.object({
  ENV: environment,
  HOST: z.preprocess(unsetIfBlank, z.string().default("0.0.0.0")),
  PORT: portNumber(3020),
  DATABASE_HOST: required,
  DATABASE_PORT: portNumber(5432),
  DATABASE_USER: required,
  // The password always comes from a file: a Docker secret on the server and
  // `env/database-password.development` locally
  DATABASE_PASSWORD_FILE: required,
  DATABASE_NAME: required,
  LOG_FORMAT: logFormat,
  LOG_LEVEL: z.preprocess(unsetIfBlank, z.enum(logLevelNames).default("info")),
  // A comma-separated list. The default is the production web's origin
  CORS_ORIGINS: z
    .preprocess(unsetIfBlank, z.string().default("https://guessir.kk-forge.com"))
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
});

/**
 * Returns the environment ENV names, or development when ENV is unset. Returns undefined when ENV
 * is invalid, and `parseConfig` then rejects it.
 */
export const environmentOf = (
  env: Readonly<Record<string, string | undefined>>,
): Environment | undefined => environment.safeParse(env.ENV).data;

/**
 * Returns the log format `env` names, or `defaultLogFormat` when LOG_FORMAT is unset or invalid.
 * The caller logs a config that fails to parse in that format, so a log collector reads the error.
 */
export const logFormatOf = (env: Readonly<Record<string, string | undefined>>): LogFormat =>
  logFormat.safeParse(env.LOG_FORMAT).data ?? defaultLogFormat;

/**
 * Reads the config that the server and the migrate step share from `env`, and throws with every
 * problem when a variable is wrong.
 */
export function parseConfig(env: Readonly<Record<string, string | undefined>>): Config {
  const parsed = envSchema.safeParse(env);

  if (!parsed.success) {
    throw new Error(`The environment is invalid:\n${z.prettifyError(parsed.error)}`);
  }

  const {
    ENV,
    HOST,
    PORT,
    DATABASE_HOST,
    DATABASE_PORT,
    DATABASE_USER,
    DATABASE_PASSWORD_FILE,
    DATABASE_NAME,
    LOG_FORMAT,
    LOG_LEVEL,
    CORS_ORIGINS,
  } = parsed.data;

  return {
    environment: ENV,
    host: HOST,
    port: PORT,
    db: {
      host: DATABASE_HOST,
      port: DATABASE_PORT,
      username: DATABASE_USER,
      passwordFile: DATABASE_PASSWORD_FILE,
      database: DATABASE_NAME,
    },
    log: { format: LOG_FORMAT, level: logLevels[LOG_LEVEL] },
    corsOrigins: CORS_ORIGINS,
  };
}

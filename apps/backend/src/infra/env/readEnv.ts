import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

import { environmentOf } from "./config.js";

/** Means the variables `readEnv` found, and the env file it read them from, if any. */
export type FoundEnv = {
  env: Readonly<Record<string, string | undefined>>;
  file: string | undefined;
};

// The folder `env/` sits three levels up from this file in both `src/` and `dist/`, so one path
// serves the source and the build.
const envFolder = new URL("../../../env/", import.meta.url);

/**
 * Returns the process environment over the env file `env/.env.<ENV>`, which the composition root
 * parses into the config. ENV defaults to development, and a variable the process sets wins over
 * the file. Reads no file when ENV is invalid or its file is missing, as in an image that holds
 * only the production file.
 */
export function readEnv(): FoundEnv {
  const environment = environmentOf(process.env);
  const file = environment && new URL(`.env.${environment}`, envFolder);
  const fromFile = file && existsSync(file) ? parseEnv(readFileSync(file, "utf8")) : undefined;

  return {
    env: { ...fromFile, ...process.env },
    file: fromFile && file ? fileURLToPath(file) : undefined,
  };
}

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { ServerConfig } from "../../src/entrypoints/server/config.js";
import { testConfig } from "./testConfig.js";

/**
 * Returns a config whose database refuses every ping, since nothing listens on port 1, and a
 * `remove` that deletes the password file the config names.
 */
export function unreachableDbConfig(): { config: ServerConfig; remove(): void } {
  const passwordDir = mkdtempSync(join(tmpdir(), "guessir-unreachable-"));
  const passwordFile = join(passwordDir, "password");

  writeFileSync(passwordFile, "password");

  return {
    config: testConfig({
      host: "127.0.0.1",
      port: 1,
      username: "guessir",
      passwordFile,
      database: "guessir",
    }),
    remove: () => rmSync(passwordDir, { recursive: true, force: true }),
  };
}

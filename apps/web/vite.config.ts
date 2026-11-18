/// <reference types="vitest/config" />
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";

import { defineConfig } from "vite";
import { z } from "zod";

const { version } = z
  .object({ version: z.string() })
  .parse(JSON.parse(readFileSync(new URL("package.json", import.meta.url), "utf8")));

const { PORT } = parseEnv(readFileSync(new URL("env/.env.development", import.meta.url), "utf8"));

export default defineConfig({
  envDir: "env",
  envPrefix: "GUESSIR_",
  // The build bakes in the `package.json` version, because each analytics envelope carries it.
  define: { "import.meta.env.GUESSIR_VERSION": JSON.stringify(version) },
  // Vite resolves the imports of the repository's packages through the tsconfig paths. Those paths
  // point at the packages' sources, so the bundle and the tests do not wait for a package build.
  resolve: { tsconfigPaths: true },
  // The dev server takes the port `env/.env.development` fixes, whatever the shell sets, and fails
  // when another service holds it, so the backend's CORS list keeps matching the web's origin.
  server: { port: Number(PORT), strictPort: true },
  test: { environment: "jsdom" },
});

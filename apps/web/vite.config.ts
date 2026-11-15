/// <reference types="vitest/config" />
import { defineConfig } from "vite";

export default defineConfig({
  envPrefix: "GUESSIR_",
  // Vite resolves the imports of the repository's packages through the tsconfig paths. Those paths
  // point at the packages' sources, so the bundle and the tests do not wait for a package build.
  resolve: { tsconfigPaths: true },
  test: { environment: "jsdom" },
});

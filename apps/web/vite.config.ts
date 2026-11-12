/// <reference types="vitest/config" />
import { defineConfig } from "vite";

export default defineConfig({
  envPrefix: "GUESSIR_",
  // Vite resolves the game imports through the tsconfig paths. Those paths point at the game
  // sources, so the bundle and the tests do not wait for the game build.
  resolve: { tsconfigPaths: true },
  test: { environment: "jsdom" },
});

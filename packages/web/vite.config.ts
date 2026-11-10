/// <reference types="vitest/config" />
import { defineConfig } from "vite";

export default defineConfig({
  envPrefix: "GUESSIR_",
  // Vite resolves the shared imports through the tsconfig paths. Those paths point at the shared
  // sources, so the bundle and the tests do not wait for the shared build.
  resolve: { tsconfigPaths: true },
  test: { environment: "jsdom" },
});

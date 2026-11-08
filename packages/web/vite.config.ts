/// <reference types="vitest/config" />
import { defineConfig } from "vite";

export default defineConfig({
  envPrefix: "GUESSIR_",
  // The tsconfig paths point the shared imports at their sources, so the bundle and the tests do not wait for the
  // shared build
  resolve: { tsconfigPaths: true },
  test: { environment: "jsdom" },
});

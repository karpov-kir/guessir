import { defineConfig } from 'vite';

export default defineConfig({
  envPrefix: 'GUESSIR_',
  // The tsconfig paths point the shared imports at their sources, so the bundle does not wait for the shared build
  resolve: { tsconfigPaths: true },
});

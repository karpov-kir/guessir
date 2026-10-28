import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'Web',
    environment: 'jsdom',
  },
  // The tsconfig paths point the shared imports at their sources, so the tests do not wait for the shared build
  resolve: { tsconfigPaths: true },
});

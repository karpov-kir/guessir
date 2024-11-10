import { defineConfig } from 'vitest/config';

// @ts-expect-error just a simple configuration
import coverageExclusions from './coverageExclusions.mjs';

export default defineConfig({
  test: {
    // Report is printed to the console as well for `test:ci`.
    coverage: {
      reporter: ['text', 'lcov'],
      exclude: coverageExclusions,
    },
  },
});

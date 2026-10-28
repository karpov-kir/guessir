import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*'],
    reporters: ['default', ['vitest-sonar-reporter', { outputFile: 'coverage/test-report.xml' }]],
    coverage: {
      include: ['packages/*/src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/migrations/**'],
      reporter: ['text-summary', 'lcovonly'],
      thresholds: { lines: 80, branches: 80, functions: 80, statements: 80 },
    },
  },
});

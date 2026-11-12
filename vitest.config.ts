import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["apps/*", "packages/*"],
    reporters: ["default", ["vitest-sonar-reporter", { outputFile: "coverage/test-report.xml" }]],
    coverage: {
      include: ["{apps,packages}/*/src/**/*.ts"],
      exclude: ["**/migrations/**"],
      reporter: ["lcovonly"],
      thresholds: { lines: 80, branches: 80, functions: 80, statements: 80 },
    },
  },
});

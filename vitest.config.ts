import { defineConfig } from "vitest/config";

import { projectsOf } from "./vitest.projects.ts";

/**
 * Runs every test level, for the `test` and `test:ci` scripts. Each level also has its own config.
 */
export default defineConfig({
  test: {
    projects: projectsOf(["unit", "integ", "infra"]),
    reporters: ["default", ["vitest-sonar-reporter", { outputFile: "coverage/test-report.xml" }]],
    coverage: {
      include: ["{apps,packages}/*/src/**/*.ts"],
      reporter: ["text-summary", "lcovonly"],
      thresholds: { lines: 80, branches: 80, functions: 80, statements: 80 },
    },
  },
});

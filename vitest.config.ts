import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["packages/*"],
    reporters: ["default", ["vitest-sonar-reporter", { outputFile: "coverage/test-report.xml" }]],
    coverage: {
      include: ["packages/*/src/**/*.ts"],
      exclude: ["**/migrations/**"],
      reporter: ["lcovonly"],
    },
  },
});

import type { TestProjectInlineConfiguration } from "vitest/config";

/** Names a test level by the suffix its files take, as in `*.unit.test.ts`. */
export type Level = "unit" | "integ" | "infra";

const filesOf = (level: Level) =>
  level === "unit" ? "src/**/*.unit.test.ts" : `tests/**/*.${level}.test.ts`;

/**
 * Returns the repository's test projects, each running the files of `levels`. The backend's infra
 * tests are a project of their own, whose global setup starts the Postgres they share. Vitest runs a
 * project's global setup only when the run holds one of its files, so no other run needs Docker.
 */
export function projectsOf(levels: Level[]): TestProjectInlineConfiguration[] {
  const include = levels.map(filesOf);
  const backendInfra: TestProjectInlineConfiguration[] = levels.includes("infra")
    ? [
        {
          extends: "./apps/backend/vitest.config.ts",
          test: {
            name: "@guessir/backend infra",
            root: "./apps/backend",
            include: [filesOf("infra")],
            globalSetup: ["tests/setups/infraTestsGlobalSetup.ts"],
          },
        },
      ]
    : [];

  return [
    {
      extends: "./apps/backend/vitest.config.ts",
      test: {
        name: "@guessir/backend",
        root: "./apps/backend",
        include: include.filter((pattern) => pattern !== filesOf("infra")),
      },
    },
    ...backendInfra,
    {
      extends: "./apps/web/vite.config.ts",
      test: { name: "@guessir/web", root: "./apps/web", include },
    },
    { test: { name: "@guessir/game", root: "./packages/game", include } },
    { test: { name: "@guessir/logger", root: "./packages/logger", include } },
  ];
}

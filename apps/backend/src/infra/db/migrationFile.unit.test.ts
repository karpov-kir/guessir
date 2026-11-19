import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { loadMigration } from "./migrationFile.js";

/**
 * Holds the invalid migrations the test loads. They sit with the tests, not with the real
 * migrations, so the migration runner never applies them.
 */
const fixtures = join(import.meta.dirname, "../../../tests/fixtures/migrations");

describe(loadMigration, () => {
  it.each([
    { file: "2099-01-01-no-kind.mjs", problem: "kind" },
    { file: "2099-01-02-unknown-kind.mjs", problem: "kind" },
    { file: "2099-01-03-no-up.mjs", problem: "up" },
  ])("should refuse $file, which declares no valid $problem", async ({ file, problem }) => {
    const path = join(fixtures, file);

    await expect(loadMigration(path)).rejects.toThrow(
      new RegExp(`^The migration ${path} is invalid:[\\s\\S]*at ${problem}`),
    );
  });
});

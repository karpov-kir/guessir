import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { loadMigration, loadMigrations } from "./postgres.js";

describe("the migrations' kinds", () => {
  let tempDir: string | undefined;

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    tempDir = undefined;
  });

  it("should load every migration with the kind it declares", async () => {
    const migrations = await loadMigrations();

    expect(migrations.map(({ name, kind }) => ({ name, kind }))).toEqual([
      { name: "2022-03-23-initial", kind: "expand" },
      { name: "2026-11-14-blank-texts", kind: "expand" },
    ]);
  });

  it.each([
    { file: "export const up = async () => {};", problem: "kind" },
    { file: 'export const kind = "shrink"; export const up = async () => {};', problem: "kind" },
    { file: 'export const kind = "expand";', problem: "up" },
  ])("should refuse a migration that declares no valid $problem", async ({ file, problem }) => {
    tempDir = mkdtempSync(join(tmpdir(), "migration-"));
    const path = join(tempDir, "2099-01-01-invalid.mjs");
    writeFileSync(path, file);

    await expect(loadMigration(path)).rejects.toThrow(
      new RegExp(`^The migration ${path} is invalid:[\\s\\S]*at ${problem}`),
    );
  });
});

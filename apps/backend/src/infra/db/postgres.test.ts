import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DbSettings, getTypeOrmConfig } from "./postgres.js";
import { ParameterFreeLogger } from "./ParameterFreeLogger.js";

describe(getTypeOrmConfig, () => {
  let tempDir: string;
  let settings: DbSettings;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "postgres-"));
    const passwordFile = join(tempDir, "password");
    writeFileSync(passwordFile, "file-password\n");
    settings = {
      host: "guessir_database",
      port: 5432,
      username: "guessir-production",
      passwordFile,
      database: "guessir-production",
    };
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("should connect with the trimmed password from its file", () => {
    expect(getTypeOrmConfig(settings)).toMatchObject({
      type: "postgres",
      host: "guessir_database",
      port: 5432,
      username: "guessir-production",
      password: "file-password",
      database: "guessir-production",
    });
  });

  it("should throw when the password file cannot be read", () => {
    const passwordFile = join(tempDir, "missing");

    expect(() => getTypeOrmConfig({ ...settings, passwordFile })).toThrow(
      `Failed to read the database password file (${passwordFile})`,
    );
  });

  it("should log queries only through the logger that drops their parameters", () => {
    expect(getTypeOrmConfig(settings).logger).toBeInstanceOf(ParameterFreeLogger);
  });
});

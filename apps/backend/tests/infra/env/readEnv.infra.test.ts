import { afterEach, describe, expect, it, vi } from "vitest";

import { readEnv } from "#/infra/env/exports.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe(readEnv, () => {
  it("should read the development file when ENV is unset", () => {
    vi.stubEnv("ENV", undefined);
    vi.stubEnv("DATABASE_NAME", undefined);

    const { env, file } = readEnv();

    expect(file).toMatch(/apps\/backend\/env\/\.env\.development$/);
    expect(env.DATABASE_NAME).toBe("guessir");
  });

  it("should read the file ENV names, under the process's own variables", () => {
    vi.stubEnv("ENV", "production");
    vi.stubEnv("DATABASE_NAME", "from-the-process");

    const { env, file } = readEnv();

    expect(file).toMatch(/\.env\.production$/);
    expect(env.DATABASE_HOST).toBe("guessir_database");
    expect(env.DATABASE_NAME).toBe("from-the-process");
  });

  it.each(["staging", "../secrets"])("should read no file for the ENV %j", (environment) => {
    vi.stubEnv("ENV", environment);

    expect(readEnv().file).toBeUndefined();
  });
});

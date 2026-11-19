import { readFileSync } from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";

import { checkOptions, isTestKey, Platform } from "@kk-forge/artel-collector";
import { describe, expect, it } from "vitest";

/**
 * Returns the analytics channel a build of `mode` gets from the mode's file in `env/`. The test
 * reads the files, since Vite's own loader would answer with the test run's values.
 */
function analyticsOf(mode: string) {
  const env = parseEnv(
    readFileSync(path.join(import.meta.dirname, "../../../env", `.env.${mode}`), "utf8"),
  );

  return { key: env.GUESSIR_ARTEL_KEY ?? "", endpoint: env.GUESSIR_ARTEL_URL ?? "" };
}

describe("the analytics channel of a build", () => {
  it.each(["development", "production"])("should hold a channel the intake takes in %s", (mode) => {
    expect(() =>
      checkOptions({ ...analyticsOf(mode), version: "1.0.0", platform: Platform.Web }),
    ).not.toThrow();
  });

  it("should hold the test key in development and the live key in production", () => {
    expect(isTestKey(analyticsOf("development").key)).toBe(true);
    expect(isTestKey(analyticsOf("production").key)).toBe(false);
  });
});

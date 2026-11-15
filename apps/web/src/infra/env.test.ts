import { describe, expect, it } from "vitest";

import { readEnv } from "./env";

describe(readEnv, () => {
  it("should return a copy of the variables the build bakes in", () => {
    const env = readEnv();

    expect(env).toEqual({ ...import.meta.env });
    expect(env).not.toBe(import.meta.env);
  });
});

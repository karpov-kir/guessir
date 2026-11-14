import { describe, expect, it } from "vitest";

import { version } from "./version.js";

describe("version", () => {
  it("should be one X.Y.Z, which a release tags", () => {
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

import { describe, expect, it } from "vitest";

import { systemIds } from "./systemIds.js";

describe("systemIds", () => {
  it("should make a URL-safe id of the length asked for, a new one each time", () => {
    const id = systemIds.newId(20);

    expect(id).toMatch(/^[\w-]{20}$/);
    expect(systemIds.newId(20)).not.toBe(id);
  });
});

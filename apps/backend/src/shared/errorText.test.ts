import { describe, expect, it } from "vitest";

import { errorText } from "./errorText.js";

describe(errorText, () => {
  it("should read an Error as its name and message, and inspect any other thrown value", () => {
    expect(errorText(new Error("ping failed"))).toBe("Error: ping failed");
    expect(errorText({ code: "ECONNREFUSED" })).toBe("{ code: 'ECONNREFUSED' }");
  });
});

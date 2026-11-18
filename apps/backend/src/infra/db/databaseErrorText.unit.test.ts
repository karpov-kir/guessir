import { describe, expect, it } from "vitest";

import { databaseErrorText } from "./databaseErrorText.js";

describe(databaseErrorText, () => {
  it("should give the SQLSTATE and the names the database gave, never its message", () => {
    const refusal = Object.assign(new Error('invalid input syntax for type integer: "a text"'), {
      code: "23514",
      table: "texts",
      column: "title",
      constraint: "title_check",
    });

    expect(databaseErrorText(refusal)).toBe(
      "SQLSTATE 23514, table texts, column title, constraint title_check",
    );
  });

  it.each([
    ["a value that is no object", "boom"],
    ["an error with no code", new Error("connection lost")],
    [
      "an error whose code is no SQLSTATE",
      Object.assign(new Error("refused"), { code: "ECONNREFUSED" }),
    ],
  ])("should give nothing for %s", (_, error) => {
    expect(databaseErrorText(error)).toBeUndefined();
  });
});

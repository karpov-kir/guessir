import { describe, expect, it } from "vitest";

import { parseConfig } from "./config";

describe(parseConfig, () => {
  it("should read the API's base URL", () => {
    expect(parseConfig({ GUESSIR_API_BASE_URL: "https://guessir-api.kk-forge.com" })).toEqual({
      apiBaseUrl: "https://guessir-api.kk-forge.com",
    });
  });

  it.each([undefined, "", "guessir-api"])("should throw on the base URL %j", (url) => {
    expect(() => parseConfig({ GUESSIR_API_BASE_URL: url })).toThrow("GUESSIR_API_BASE_URL");
  });
});

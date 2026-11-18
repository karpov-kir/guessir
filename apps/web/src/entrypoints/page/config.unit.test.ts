import { describe, expect, it } from "vitest";

import { parseConfig } from "./config";

const env = {
  GUESSIR_API_BASE_URL: "https://guessir-api.kk-forge.com",
  GUESSIR_ARTEL_URL: "https://idea-packer-api.kk-forge.com/v1/public/relay",
  GUESSIR_ARTEL_KEY: "site-aaaaaaaaaa",
  GUESSIR_VERSION: "1.2.3",
};

describe(parseConfig, () => {
  it("should read the API's base URL and the analytics channel", () => {
    expect(parseConfig(env)).toEqual({
      apiBaseUrl: "https://guessir-api.kk-forge.com",
      analytics: {
        key: "site-aaaaaaaaaa",
        endpoint: "https://idea-packer-api.kk-forge.com/v1/public/relay",
        version: "1.2.3",
      },
    });
  });

  it.each([undefined, "", "guessir-api"])("should throw on the base URL %j", (url) => {
    expect(() => parseConfig({ ...env, GUESSIR_API_BASE_URL: url })).toThrow(
      "GUESSIR_API_BASE_URL",
    );
  });

  it.each(["GUESSIR_ARTEL_URL", "GUESSIR_ARTEL_KEY", "GUESSIR_VERSION"])(
    "should throw without %s",
    (name) => {
      expect(() => parseConfig({ ...env, [name]: undefined })).toThrow(name);
    },
  );
});

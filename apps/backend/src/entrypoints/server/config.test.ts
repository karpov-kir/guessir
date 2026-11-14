import { describe, expect, it } from "vitest";

import { parseConfig } from "./config.js";

const env = {
  DATABASE_HOST: "guessir_database",
  DATABASE_USER: "guessir-production",
  DATABASE_PASSWORD_FILE: "/run/secrets/database-password",
  DATABASE_NAME: "guessir-production",
};

describe(parseConfig, () => {
  it("should read the database settings and default the ports and the host", () => {
    expect(parseConfig(env)).toEqual({
      host: "0.0.0.0",
      port: 3020,
      db: {
        host: "guessir_database",
        port: 5432,
        username: "guessir-production",
        passwordFile: "/run/secrets/database-password",
        database: "guessir-production",
      },
    });
  });

  it("should take HOST, PORT and DATABASE_PORT when set", () => {
    expect(
      parseConfig({ ...env, HOST: "127.0.0.1", PORT: "8080", DATABASE_PORT: "5433" }),
    ).toMatchObject({ host: "127.0.0.1", port: 8080, db: { port: 5433 } });
  });

  it("should read a variable that is empty or only whitespace as unset", () => {
    expect(parseConfig({ ...env, HOST: "", PORT: "  ", DATABASE_PORT: "\t" })).toMatchObject({
      host: "0.0.0.0",
      port: 3020,
      db: { port: 5432 },
    });
  });

  it.each(["DATABASE_HOST", "DATABASE_USER", "DATABASE_PASSWORD_FILE", "DATABASE_NAME"] as const)(
    "should throw without %s, and with an empty one",
    (name) => {
      const { [name]: _, ...without } = env;

      expect(() => parseConfig(without)).toThrow(name);
      expect(() => parseConfig({ ...env, [name]: " " })).toThrow("must be set");
    },
  );

  it.each(["port", "-1", "65536", "1.5"])("should throw on the PORT %j", (port) => {
    expect(() => parseConfig({ ...env, PORT: port })).toThrow("PORT");
  });

  it("should name every invalid variable at once", () => {
    expect(() => parseConfig({ PORT: "port" })).toThrow(
      /PORT[\s\S]*DATABASE_HOST[\s\S]*DATABASE_USER[\s\S]*DATABASE_PASSWORD_FILE[\s\S]*DATABASE_NAME/,
    );
  });
});

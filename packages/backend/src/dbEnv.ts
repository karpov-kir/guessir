import { readFileSync } from "node:fs";

const requireEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} must be set`);
  }

  return value;
};

const readPassword = (passwordFile: string): string => {
  try {
    return readFileSync(passwordFile, "utf8").trimEnd();
  } catch (error) {
    throw new Error(`Failed to read DATABASE_PASSWORD_FILE (${passwordFile})`, { cause: error });
  }
};

/**
 * Returns the database connection settings from the environment, and throws when a required
 * variable is unset or the password file cannot be read. The password always comes from a file: a
 * Docker secret on the server and `env/database-password.development` locally.
 */
export const getDbSettings = () => ({
  host: requireEnv("DATABASE_HOST"),
  port: process.env.DATABASE_PORT ? Number.parseInt(process.env.DATABASE_PORT) : 5432,
  username: requireEnv("DATABASE_USER"),
  password: readPassword(requireEnv("DATABASE_PASSWORD_FILE")),
  database: requireEnv("DATABASE_NAME"),
});

import { readFileSync } from 'fs';

// Reads the password from the file at DATABASE_PASSWORD_FILE (e.g. a Docker secret) if set, otherwise falls back to DATABASE_PASSWORD
export const getDbPassword = (): string | undefined => {
  const passwordFile = process.env.DATABASE_PASSWORD_FILE;

  if (!passwordFile) {
    return process.env.DATABASE_PASSWORD;
  }

  try {
    return readFileSync(passwordFile, 'utf8').trimEnd();
  } catch (error) {
    throw new Error(`Failed to read the DB password from DATABASE_PASSWORD_FILE (${passwordFile})`, { cause: error });
  }
};

// DATABASE_HOST turns the persistent DB on; without it the app keeps its data in memory
export const isDbEnabled = () => {
  if (!process.env.DATABASE_HOST) {
    return false;
  }

  ['DATABASE_USER', 'DATABASE_NAME'].forEach((envName) => {
    if (!process.env[envName]) {
      throw new Error(`${envName} must be provided when DATABASE_HOST is set`);
    }
  });

  if (!process.env.DATABASE_PASSWORD && !process.env.DATABASE_PASSWORD_FILE) {
    throw new Error('DATABASE_PASSWORD or DATABASE_PASSWORD_FILE must be provided when DATABASE_HOST is set');
  }

  return true;
};

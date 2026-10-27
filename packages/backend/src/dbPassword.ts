import { readFileSync } from 'fs';

// Reads the password from the file at DB_PW_FILE (e.g. a Docker secret) if set, otherwise falls back to DB_PW
export const getDbPassword = (): string | undefined => {
  const passwordFile = process.env.DB_PW_FILE;

  if (!passwordFile) {
    return process.env.DB_PW;
  }

  try {
    return readFileSync(passwordFile, 'utf8').trimEnd();
  } catch (error) {
    throw new Error(`Failed to read the DB password from DB_PW_FILE (${passwordFile})`, { cause: error });
  }
};

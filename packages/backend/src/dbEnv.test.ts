import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getDbSettings } from './dbEnv';

describe(getDbSettings, () => {
  let tempDir: string;
  let passwordFile: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'dbEnv-'));
    passwordFile = join(tempDir, 'password');
    writeFileSync(passwordFile, 'file-password\n');
    vi.stubEnv('DATABASE_HOST', 'guessir_database');
    vi.stubEnv('DATABASE_PORT', '');
    vi.stubEnv('DATABASE_USER', 'guessir-production');
    vi.stubEnv('DATABASE_NAME', 'guessir-production');
    vi.stubEnv('DATABASE_PASSWORD_FILE', passwordFile);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should read the settings, with the trimmed password from its file and port 5432 by default', () => {
    expect(getDbSettings()).toEqual({
      host: 'guessir_database',
      port: 5432,
      username: 'guessir-production',
      password: 'file-password',
      database: 'guessir-production',
    });
  });

  it('should take DATABASE_PORT when set', () => {
    vi.stubEnv('DATABASE_PORT', '5433');

    expect(getDbSettings().port).toBe(5433);
  });

  it.each(['DATABASE_HOST', 'DATABASE_USER', 'DATABASE_NAME', 'DATABASE_PASSWORD_FILE'])(
    'should throw without %s',
    (envName) => {
      vi.stubEnv(envName, '');

      expect(() => getDbSettings()).toThrow(`${envName} must be set`);
    },
  );

  it('should throw when DATABASE_PASSWORD_FILE cannot be read', () => {
    const missingFile = join(tempDir, 'missing');
    vi.stubEnv('DATABASE_PASSWORD_FILE', missingFile);

    expect(() => getDbSettings()).toThrow(`Failed to read DATABASE_PASSWORD_FILE (${missingFile})`);
  });
});

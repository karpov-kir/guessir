import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getDbPassword, isDbEnabled } from './dbEnv';

describe(getDbPassword, () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'dbEnv-'));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should return DATABASE_PASSWORD when DATABASE_PASSWORD_FILE is not set', () => {
    vi.stubEnv('DATABASE_PASSWORD', 'env-password');
    vi.stubEnv('DATABASE_PASSWORD_FILE', '');

    expect(getDbPassword()).toBe('env-password');
  });

  it('should prefer the trimmed content of DATABASE_PASSWORD_FILE over DATABASE_PASSWORD', () => {
    const passwordFile = join(tempDir, 'password');
    writeFileSync(passwordFile, 'file-password\n');
    vi.stubEnv('DATABASE_PASSWORD', 'env-password');
    vi.stubEnv('DATABASE_PASSWORD_FILE', passwordFile);

    expect(getDbPassword()).toBe('file-password');
  });

  it('should throw when DATABASE_PASSWORD_FILE cannot be read', () => {
    const passwordFile = join(tempDir, 'missing');
    vi.stubEnv('DATABASE_PASSWORD_FILE', passwordFile);

    expect(() => getDbPassword()).toThrow(
      `Failed to read the DB password from DATABASE_PASSWORD_FILE (${passwordFile})`,
    );
  });
});

describe(isDbEnabled, () => {
  beforeEach(() => {
    vi.stubEnv('DATABASE_HOST', 'guessir_database');
    vi.stubEnv('DATABASE_USER', 'guessir-production');
    vi.stubEnv('DATABASE_NAME', 'guessir-production');
    vi.stubEnv('DATABASE_PASSWORD', '');
    vi.stubEnv('DATABASE_PASSWORD_FILE', '/run/secrets/database-password');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should be off without DATABASE_HOST', () => {
    vi.stubEnv('DATABASE_HOST', '');

    expect(isDbEnabled()).toBe(false);
  });

  it('should be on with DATABASE_HOST and a password file', () => {
    expect(isDbEnabled()).toBe(true);
  });

  it('should be on with DATABASE_HOST and a password', () => {
    vi.stubEnv('DATABASE_PASSWORD_FILE', '');
    vi.stubEnv('DATABASE_PASSWORD', 'password');

    expect(isDbEnabled()).toBe(true);
  });

  it.each(['DATABASE_USER', 'DATABASE_NAME'])('should throw without %s', (envName) => {
    vi.stubEnv(envName, '');

    expect(() => isDbEnabled()).toThrow(`${envName} must be provided when DATABASE_HOST is set`);
  });

  it('should throw without a password or a password file', () => {
    vi.stubEnv('DATABASE_PASSWORD_FILE', '');

    expect(() => isDbEnabled()).toThrow('DATABASE_PASSWORD or DATABASE_PASSWORD_FILE must be provided');
  });
});

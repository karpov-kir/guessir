import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getDbPassword } from './dbPassword';

describe(getDbPassword, () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'dbPassword-'));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should return DB_PW when DB_PW_FILE is not set', () => {
    vi.stubEnv('DB_PW', 'env-password');
    vi.stubEnv('DB_PW_FILE', '');

    expect(getDbPassword()).toBe('env-password');
  });

  it('should prefer the trimmed content of DB_PW_FILE over DB_PW', () => {
    const passwordFile = join(tempDir, 'password');
    writeFileSync(passwordFile, 'file-password\n');
    vi.stubEnv('DB_PW', 'env-password');
    vi.stubEnv('DB_PW_FILE', passwordFile);

    expect(getDbPassword()).toBe('file-password');
  });

  it('should throw when DB_PW_FILE cannot be read', () => {
    const passwordFile = join(tempDir, 'missing');
    vi.stubEnv('DB_PW_FILE', passwordFile);

    expect(() => getDbPassword()).toThrow(`Failed to read the DB password from DB_PW_FILE (${passwordFile})`);
  });
});

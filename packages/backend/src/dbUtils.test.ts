import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getTypeOrmConfig } from './dbUtils.js';
import { ParameterFreeLogger } from './ParameterFreeLogger.js';

describe(getTypeOrmConfig, () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'dbUtils-'));
    const passwordFile = join(tempDir, 'password');
    writeFileSync(passwordFile, 'file-password\n');
    vi.stubEnv('DATABASE_HOST', 'guessir_database');
    vi.stubEnv('DATABASE_USER', 'guessir-production');
    vi.stubEnv('DATABASE_NAME', 'guessir-production');
    vi.stubEnv('DATABASE_PASSWORD_FILE', passwordFile);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should log queries only through the logger that drops their parameters', () => {
    const config = getTypeOrmConfig();

    expect(config.logger).toBeInstanceOf(ParameterFreeLogger);
  });
});

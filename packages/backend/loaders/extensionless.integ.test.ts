import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const loaderPath = join(import.meta.dirname, 'extensionless.mjs');
let fixtureDir: string;

/** Runs a fixture module through the loader, and returns what it printed. */
const runWithLoader = async (entry: string) => {
  const { stdout } = await execFileAsync(process.execPath, ['--import', loaderPath, join(fixtureDir, entry)]);

  return stdout.trim();
};

describe('extensionless loader', () => {
  beforeAll(async () => {
    fixtureDir = await mkdtemp(join(tmpdir(), 'extensionless-'));

    await mkdir(join(fixtureDir, 'folder'));
    await writeFile(join(fixtureDir, 'package.json'), '{"type":"module"}');
    await writeFile(join(fixtureDir, 'module.js'), "export const name = 'module';");
    await writeFile(join(fixtureDir, 'folder', 'index.js'), "export const name = 'folder';");
    await writeFile(
      join(fixtureDir, 'relative.js'),
      "import { name as a } from './module'; import { name as b } from './folder'; console.log(a, b);",
    );
    await writeFile(join(fixtureDir, 'bare.js'), "import 'not-a-package';");
    await writeFile(join(fixtureDir, 'missing.js'), "import './missing-module';");
  });

  afterAll(async () => {
    await rm(fixtureDir, { recursive: true, force: true });
  });

  it('should resolve relative imports without an extension to a file and to a folder index', async () => {
    await expect(runWithLoader('relative.js')).resolves.toBe('module folder');
  });

  it('should leave a missing bare package to fail as without the loader', async () => {
    await expect(runWithLoader('bare.js')).rejects.toThrow("Cannot find package 'not-a-package'");
  });

  it('should report the original specifier when no suffix matches', async () => {
    await expect(runWithLoader('missing.js')).rejects.toThrow('missing-module');
  });
});

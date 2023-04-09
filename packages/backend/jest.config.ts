import type { Config } from 'jest';

import { getSwcConfig } from '../../jest.swcrc';

export default async (): Promise<Config> => ({
  displayName: 'Backend',
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', getSwcConfig()],
  },
  // TODO: remove it once Jest is migrated to ESM: https://jestjs.io/docs/ecmascript-modules
  transformIgnorePatterns: ['node_modules/(?!nanoid)'],
});

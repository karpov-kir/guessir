import type { Config } from 'jest';

import { getSwcConfig } from '../../jest.swcrc';

export default async (): Promise<Config> => ({
  displayName: 'Web',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/src/testUtils/fileMock.ts',
    '\\.css$': '<rootDir>/src/testUtils/fileMock.ts',
  },
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', getSwcConfig({ GUESSIR_API_BASE_URL: '/' })],
  },
  // TODO: remove it once Jest is migrated to ESM: https://jestjs.io/docs/ecmascript-modules
  transformIgnorePatterns: ['node_modules/(?!url-join)'],
});

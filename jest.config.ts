import { Config } from 'jest';

export default async (): Promise<Config> => ({
  testMatch: ['**/*.@(test|spec|e2e-spec).*'],
  collectCoverage: true,
  coverageDirectory: './coverage',
  verbose: true,
  projects: ['./packages/*'],
  testResultsProcessor: 'jest-sonar-reporter',
});

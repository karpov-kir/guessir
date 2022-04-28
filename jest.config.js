/* eslint-disable @typescript-eslint/no-var-requires */

const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig');

module.exports = {
  testMatch: ['<rootDir>/src/**/*.@(test|spec|e2e-spec).*'],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/',
  verbose: true,
  projects: ['<rootDir>/packages/*'],
  testResultsProcessor: 'jest-sonar-reporter',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
};

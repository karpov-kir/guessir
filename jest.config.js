module.exports = {
  testMatch: ['<rootDir>/src/**/*.(test|spec|e2e-spec).*'],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  verbose: true,
  projects: ['<rootDir>/packages/*'],
};

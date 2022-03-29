module.exports = {
  preset: 'ts-jest',
  testMatch: ['<rootDir>/src/**/*.(test|spec|e2e-spec).*'],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  verbose: true,
};

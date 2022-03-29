/* eslint-disable @typescript-eslint/no-var-requires */

const baseConfig = require('./jest.config.base');

module.exports = {
  ...baseConfig,
  roots: ['<rootDir>'],
  projects: ['<rootDir>/packages/backend', '<rootDir>/packages/web'],
};

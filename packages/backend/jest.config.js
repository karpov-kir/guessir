/* eslint-disable @typescript-eslint/no-var-requires */

const baseConfig = require('../../jest.config.base');
const packageJson = require('./package');

module.exports = {
  ...baseConfig,
  name: packageJson.name,
  displayName: packageJson.name,
};

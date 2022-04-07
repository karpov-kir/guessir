/* eslint-disable @typescript-eslint/no-var-requires */

const packageJson = require('./package');

module.exports = {
  // Preset must be set at the project level so the nearest tsconfig.json is used instead of the root one
  preset: 'ts-jest',
  displayName: packageJson.name,
};

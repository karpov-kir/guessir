/* eslint-disable @typescript-eslint/no-var-requires */

const packageJson = require('./package');

module.exports = {
  // Preset must be set at the project level so the nearest tsconfig.json is used
  preset: 'ts-jest/presets/js-with-ts',
  displayName: packageJson.name,
  transformIgnorePatterns: [
    // `url-join` is distributed as an ESM NPM package. Jest fails with a syntax error on `export default ...`
    // keywords inside `url-join`. To fix it we need to tell Jest to transform `url-join` via `ts-jest`. By default
    // Jest does not transform modules in the `node_modules` folder. This also requires to set `allowJs` to true in
    // the `tsconfig.json` as `url-join` has only a JS version in the NPM package.
    // TODO remove it and `allowJs` once `url-join` has a CJS version or Node.js supports ESM.
    // https://github.com/jfromaniello/url-join/issues/78#issuecomment-1084281904
    'node_modules/(?!url-join)',
  ],
  testEnvironment: 'jsdom',
};

# GuesSir!

A simple tool to turn any English text into a word guessing game. Try it out https://guessir.kk-forge.com.

## Dependencies

The root `overrides` installs `minimatch` 11 for eslint and typescript-eslint, which ask for `^10`: the fix for GHSA-g3hv-75wg-m249 is only in 11. Remove the override once both ask for `^11`.

`.npmrc` sets what an install takes, with the reason for each setting beside it; the install scripts it lets run are listed in `allowScripts` in `package.json`.

# GuesSir!

A simple tool to turn any English text into a word guessing game. Try it out https://guessir.kk-forge.com.

## Dependencies

`fastify` in `packages/backend` is pinned to the exact version that `@nestjs/platform-fastify` depends on, so only one copy of fastify is installed. With two copies, `@fastify/helmet` no longer type-checks against the app. Raise both together.

The root `overrides` lifts `minimatch` from 10 to 11 for eslint and typescript-eslint: the fix for GHSA-g3hv-75wg-m249 shipped only in 11, and both still ask for `^10`. Drop the override once they ask for `^11`.

`.npmrc` holds back versions younger than 7 days (`min-release-age`) and fails an install on any package whose install scripts `allowScripts` in `package.json` does not list (`strict-allow-scripts`).

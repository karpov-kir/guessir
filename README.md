# GuesSir!

A simple tool to turn any English text into a word guessing game. Try it out https://guessir.kk-forge.com.

## Dependencies

`fastify` in `packages/backend` is pinned to the exact version that `@nestjs/platform-fastify` depends on, so only one copy of fastify is installed. With two copies, `@fastify/helmet` no longer type-checks against the app. Raise both together.

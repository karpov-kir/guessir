# guessir

## Product

The game is for English texts. Expand only English contractions, such as `don't` into `do not`, from the table in `packages/game/src/shared/lexemeAnalyzer/LexemeNormalizer.ts`. Support another language only as far as its words appear in an English text. Count a letter of any script, and a mark that joins one, as part of a word, so `Café`, `naïve` or `İstanbul` stays one word to guess.

## Imports

Each app and package names its own `src/` as `#src/` through `imports` in its `package.json`, and an app names its `tests/` as `#tests/`. Such an import ends in `.js`, since a subpath pattern gets no extension added. A file reaches another folder only that way, and its own folder through `./`.

The backend, `game` and `logger` run in Node as the tsc output in `dist/`, so their `#src/*` and each export of a package point at `dist/`, and their `source` condition at `src/`. tsc, Vite and Vitest ask for `source`, so a type check, the web build and the tests need no package build.

## Usage statistics

The web app sends anonymous usage statistics through `@kk-forge/artel-collector`, to the Guessir product's `site` channel in the Artel admin. `apps/web/src/entities/analytics/analytics.ts` lists the events. The channel's allowlist holds the same names, params and values, so a change to one needs the same change to the other. `apps/web/env/.env.development` holds the channel's test key, and `apps/web/env/.env.production` its live key.

## Database migrations

A migration is a file in `apps/backend/src/infra/db/migrations/` that exports `up` and `kind`. A migration without a valid `kind` fails to load and fails the tests.

The kind answers one question: does the code before this migration still run on the database after it?

- `expand`: yes. Adding a table, a column or an index is an expand. So is moving or cleaning data that the earlier code reads as before.
- `contract`: no. A migration that drops, renames or changes the type of anything the earlier code reads or writes is a contract.

The migrate step records each migration's kind in the database, so earlier code reads it there. The server and the migrate step refuse a database that holds a contract migration their code does not know, and only warn about an unknown expand one. Ship a contract after the code that no longer needs what it drops runs everywhere. kk-flavor `standards/project.md` → **Migrations** owns the forward-only and expand-then-contract rules.

# GuesSir!

A simple tool to turn any English text into a word guessing game. Try it out https://guessir.kk-forge.com.

The game is built for English, contractions included. It still reads a word from another language whole, so Café or İstanbul in an English text is one word to guess.

## Release

Raise `version` in `apps/backend/package.json` or `apps/web/package.json`. CI on `main` then publishes `dr.kk-forge.com/guessir-backend:<version>` or `dr.kk-forge.com/guessir-web:<version>` with a GitHub Release `backend-v<version>` or `web-v<version>`. A manual run of CI on a branch releases `<version>-dev.<run>` for a trial on the server.

## Database migrations

The server runs no migration, and it refuses to start on a database short of one, or on one that holds a contract migration from newer code. The migrate step applies them: `node apps/backend/dist/entrypoints/migrate/start.js` in the backend image, which a deploy runs as a one-off job before the server rolls. Locally, `mise run backend:db:migrate` runs it on the local database after a build, and `mise run backend:start:dev` runs it first.

## Configuration

The server and the migrate step read `apps/backend/env/.env.<ENV>`, where `ENV` is `development` by default, `staging` or `production`. A variable the process sets wins over the file. The image holds only `.env.production`, and the database password comes from the file `DATABASE_PASSWORD_FILE` names. `CORS_ORIGINS` is a comma-separated list of the web origins whose pages may call the API, by default `https://guessir.kk-forge.com`.

## Logs

The server and the migrate step log each record as it happens. `LOG_FORMAT` picks the shape: `pretty` by default, for a person, with warnings and errors on standard error, or `json`, one line per record on standard output, for a log collector. `LOG_LEVEL` drops the records below it: `debug`, `info` by default, `warn`, `error` or `silent`.

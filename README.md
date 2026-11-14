# GuesSir!

A simple tool to turn any English text into a word guessing game. Try it out https://guessir.kk-forge.com.

## Release

Raise `version` in `apps/backend/package.json` or `apps/web/package.json`. CI on `main` then publishes `dr.kk-forge.com/guessir-backend:<version>` or `dr.kk-forge.com/guessir-web:<version>` with a GitHub Release `backend-v<version>` or `web-v<version>`. A manual run of CI on a branch releases `<version>-dev.<run>` for a trial on the server.

## Database migrations

The server runs no migration, and it refuses to start on a database short of one, or on one that holds a contract migration from newer code. The migrate step applies them: `npm run migrate -w @guessir/backend` after a build, or `node apps/backend/dist/entrypoints/migrate/start.js` in the backend image, which a deploy runs as a one-off job before the server rolls. `npm run start:dev -w @guessir/backend` runs it on the local database first.

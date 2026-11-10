# GuesSir!

A simple tool to turn any English text into a word guessing game. Try it out https://guessir.kk-forge.com.

## Release

Raise `version` in `packages/backend/package.json` or `packages/web/package.json`. CI on `main` then publishes `dr.kk-forge.com/guessir-backend:<version>` or `dr.kk-forge.com/guessir-web:<version>` with a GitHub Release `backend-v<version>` or `web-v<version>`. A manual run of CI on a branch releases `<version>-dev.<run>` for a trial on the server.

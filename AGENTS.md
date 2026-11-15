# guessir

## Database migrations

A migration is a file in `apps/backend/src/infra/db/migrations/` that exports `up` and `kind`. A migration without a valid `kind` fails to load and fails the tests.

The kind answers one question: does the code before this migration still run on the database after it?

- `expand`: yes. Adding a table, a column or an index is an expand. So is moving or cleaning data that the earlier code reads as before.
- `contract`: no. A migration that drops, renames or changes the type of anything the earlier code reads or writes is a contract.

The migrate step records each migration's kind in the database, so earlier code reads it there. The server and the migrate step refuse a database that holds a contract migration their code does not know, and only warn about an unknown expand one. Ship a contract after the code that no longer needs what it drops runs everywhere. kk-flavor `standards/project.md` → **Migrations** owns the forward-only and expand-then-contract rules.

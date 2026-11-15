import { type MigrationFn, MigrationKind } from "../migrationFile.js";

// This migration changes rows and no column, and the earlier code reads the texts that remain as
// before
export const kind = MigrationKind.Expand;

/**
 * Matches a value that is empty or holds only the characters `String.prototype.trim` strips, so
 * the migration finds exactly the values the API refuses as blank.
 */
const blankPattern = String.raw`'^[\t\n\v\f\r \u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]*$'`;

/**
 * Brings the stored texts to the rules the API applies: it deletes a text whose title or text is
 * blank and stores a blank description as none. A second run changes nothing.
 */
export const up: MigrationFn = async ({ context: { transaction } }) => {
  await transaction(async (query) => {
    await query(`DELETE FROM texts WHERE title ~ ${blankPattern} OR text ~ ${blankPattern}`);
    await query(`UPDATE texts SET description = NULL WHERE description ~ ${blankPattern}`);
  });
};

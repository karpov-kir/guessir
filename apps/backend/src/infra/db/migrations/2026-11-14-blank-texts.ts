import type { MigrationFn } from "../postgres.js";

/**
 * Matches a value that is empty or holds only the characters `String.prototype.trim` strips, so
 * the migration finds exactly the values the API refuses as blank.
 */
const blank = String.raw`'^[\t\n\v\f\r \u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]*$'`;

/**
 * Brings the stored texts to the rules the API applies: it deletes a text whose title or text is
 * blank and stores a blank description as none. A second run changes nothing.
 */
export const up: MigrationFn = async ({ context: { transaction } }) => {
  await transaction(async (query) => {
    await query(`DELETE FROM texts WHERE title ~ ${blank} OR text ~ ${blank}`);
    await query(`UPDATE texts SET description = NULL WHERE description ~ ${blank}`);
  });
};

export const down = async () => {};

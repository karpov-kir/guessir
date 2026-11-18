import { z } from "zod";

import { codePointString } from "./strings.js";

/**
 * Maximum lengths of the title, description and text, in code points. The database columns count
 * length in code points, not in UTF-16 units.
 */
export const createTextLimits = { title: 500, description: 4000, text: 4000 } as const;

/**
 * Builds a string schema that fits a text column of `max` code points and
 * holds no U+0000. Postgres cannot store U+0000 in a text column.
 */
const columnString = (max: number) =>
  codePointString(max).refine((value) => !value.includes("\u0000"), {
    error: "Invalid string: must not contain the character U+0000",
  });

/** Builds a column string schema that also refuses a value that is empty or only whitespace. */
const filledColumnString = (max: number) =>
  columnString(max).refine((value) => value.trim() !== "", {
    error: "Invalid string: must not be blank",
  });

/** Validates the body of a create-text request. */
export const createTextDtoSchema = z.strictObject({
  title: filledColumnString(createTextLimits.title),
  // The schema refuses a blank description. A client sends a text without a description by
  // leaving the key out, so a blank one would be a second way to say that.
  description: filledColumnString(createTextLimits.description).optional(),
  text: filledColumnString(createTextLimits.text),
  allowShowingFirstLetters: z.boolean().default(false),
  allowShowingText: z.boolean().default(false),
});

export const createTextDtoResponseSchema = z.object({ id: z.string().min(1) });

export type CreateTextDto = z.output<typeof createTextDtoSchema>;
export type CreateTextDtoResponse = z.output<typeof createTextDtoResponseSchema>;

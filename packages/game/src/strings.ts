import { z } from "zod";

/**
 * Builds a string schema of at most `max` code points. Every length limit of the API counts code
 * points, the unit in which Postgres counts a varchar, so a stored value always fits its column.
 * `z.string().max()` counts UTF-16 units instead.
 */
export const codePointString = (max: number) =>
  z.string().refine((value) => Array.from(value).length <= max, {
    error: `Too big: expected string to have <=${max} characters`,
  });

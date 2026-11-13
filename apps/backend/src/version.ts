import { readFileSync } from "node:fs";

import { z } from "zod";

/**
 * Holds the backend version from `package.json`. CI tags the image with it. The image copies
 * `package.json` with the dependencies. The file sits one level above both `src` and `dist`, so the
 * same path works from each.
 */
export const version = z
  .object({ version: z.string() })
  .parse(JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"))).version;

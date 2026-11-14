import { nanoid } from "nanoid";

import type { IdGenerator } from "../shared/IdGenerator.js";

/** Makes ids with nanoid, which draws on the system's secure random source. */
export const systemIds: IdGenerator = { newId: (length) => nanoid(length) };

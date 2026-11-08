import { readFileSync } from "node:fs";

/**
 * The backend's version, which CI tags its image with. It lives in the backend's package.json, one level above src
 * and dist alike, which the image copies along with the dependencies.
 */
export const version: string = (
  JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
    version: string;
  }
).version;

import { writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Writes `package.json` into each build output folder named on the command line, `dist` by default.
 * Node takes `#/` from the nearest `package.json`, so this one points it at that folder, where the
 * workspace's own `#/*` names `src/`. The backend names its referenced packages' folders too, since
 * its `tsc -b` builds them without their own build script.
 */
const folders = process.argv.length > 2 ? process.argv.slice(2) : ["dist"];

for (const folder of folders) {
  writeFileSync(
    join(folder, "package.json"),
    `${JSON.stringify({ type: "module", imports: { "#/*": "./*" } }, null, 2)}\n`,
  );
}

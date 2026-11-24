import { defaultServerConditions } from "vite";
import { defineProject } from "vitest/config";

export default defineProject({
  // The "source" condition of the repository's packages' exports points at their sources. The
  // tests then run without a prior build of a package.
  ssr: { resolve: { conditions: ["source", ...defaultServerConditions] } },
});

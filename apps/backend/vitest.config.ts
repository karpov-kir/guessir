import { defineProject } from "vitest/config";

export default defineProject({
  // Vitest resolves the imports of the repository's packages to their sources via the tsconfig
  // paths. The tests then run without a prior build of a package.
  resolve: { tsconfigPaths: true },
});
